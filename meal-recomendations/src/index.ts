
import { Hono } from 'hono'
import { GoogleGenAI } from '@google/genai'
import { Database } from 'bun:sqlite'

const app = new Hono()
const dbPath = `${import.meta.dir}/../data/database.sqlite`

console.log('Ścieżka bazy danych:', dbPath)

const db = new Database(dbPath)

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  throw new Error('Brak GEMINI_API_KEY w pliku .env')
}

const ai = new GoogleGenAI({
  apiKey,
})

const MODEL = 'gemini-3.5-flash-lite'

// Pomocnicza funkcja do logowania
function log(requestId: string, message: string) {
  const time = new Date().toLocaleTimeString('pl-PL')

  console.log(`[${time}] [${requestId}] ${message}`)
}

app.get('/', (c) => {
  return c.text('API is running!')
})

app.post('/api/chat', async (c) => {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()

  let stage = 'Odbieranie zapytania'

  log(requestId, '========================================')
  log(requestId, '1. OTRZYMANO ZAPYTANIE Z APLIKACJI')

  try {
    // Odczytujemy dane przesłane przez aplikację
    const body = await c.req.json()

    const { message, conversationId } = body

    log(requestId, `Otrzymano wiadomość (${typeof message === 'string' ? message.length : 0} znaków)`)

    // Walidacja danych
    if (
      !message ||
      (!Array.isArray(message) && typeof message !== 'string')
    ) {
      log(requestId, 'BŁĄD: Nieprawidłowa wiadomość')

      return c.json({
        error: 'Message is required',
      }, 400)
    }

    if (conversationId !== undefined && typeof conversationId !== 'string') {
      log(requestId, 'BŁĄD: Nieprawidłowy conversationId')

      return c.json({
        error: 'Invalid conversationId',
      }, 400)
    }

    // Pobieramy instrukcje asystenta
    stage = 'Odczytywanie instrukcji'

    log(requestId, '2. ODCZYTYWANIE INSTRUKCJI ASYSTENTA')

    const instructions = await Bun.file(
      './instructions/instructions.txt'
    ).text()

    log(requestId, `Instrukcje odczytane (${instructions.length} znaków)\n ${instructions}`)

    // Wysyłamy zapytanie do Gemini
    stage = 'Komunikacja z Gemini'

    log(requestId, '3. WYSYŁANIE ZAPYTANIA DO GEMINI')
    log(requestId, `Model: ${MODEL}`)
    log(requestId, `Kontynuacja rozmowy: ${conversationId ? 'TAK' : 'NIE'}`)

    const geminiStartTime = Date.now()

    const interaction = await ai.interactions.create({
      model: MODEL,
      input: Array.isArray(message)
  ? message.join('\n')
  : message,
      system_instruction: instructions,
      ...(conversationId
        ? { previous_interaction_id: conversationId }
        : {}),
    }, requestId)

    
  async function askGeminiWithRetry(
    request: Parameters<typeof ai.interactions.create>[0],
    requestId: string
  ) {
    const maxAttempts = 3
    const delays = [2000, 5000]

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        log(requestId, `Gemini: próba ${attempt}/${maxAttempts}`)

        return await ai.interactions.create(request)

      } catch (error: any) {
        const status = error?.status ?? error?.code

        const retryable = [429, 500, 502, 503, 504].includes(Number(status))

        if (!retryable || attempt === maxAttempts) {
          throw error
        }

        const delay = delays[attempt - 1]

        log(requestId, `Gemini zwróciło błąd ${status}. Ponawiam za ${delay / 1000}s.`)

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw new Error('Gemini: przekroczono liczbę prób')
  }


    const geminiTime = Date.now() - geminiStartTime

    // Otrzymaliśmy odpowiedź
    log(requestId, '4. OTRZYMANO ODPOWIEDŹ Z GEMINI')
    log(requestId, `Czas odpowiedzi Gemini: ${geminiTime} ms`)
    log(requestId, `ID interakcji: ${interaction.id}`)

    const responseText = interaction.output_text
    log(requestId, `Tekst odpowiedzi: ${responseText}`)


    if (!responseText) {
      throw new Error('Gemini zwróciło pustą odpowiedź tekstową')
    }

    log(requestId, `Długość odpowiedzi: ${responseText.length} znaków`)

    // Przygotowujemy odpowiedź dla aplikacji
    stage = 'Wysyłanie odpowiedzi do aplikacji'

    log(requestId, '5. WYSYŁANIE ODPOWIEDZI DO TELEFONU')

    const response = c.json({
      response: responseText,
      conversationId: interaction.id,
    })

    log(requestId, 'Odpowiedź HTTP przygotowana')
    log(requestId, `Całkowity czas obsługi: ${Date.now() - startTime} ms`)
    log(requestId, 'ZAKOŃCZONO POMYŚLNIE')
    log(requestId, '========================================')

    return response

  } catch (error) {
    const totalTime = Date.now() - startTime

    log(requestId, '!!! WYSTĄPIŁ BŁĄD !!!')
    log(requestId, `Etap: ${stage}`)
    log(requestId, `Czas do wystąpienia błędu: ${totalTime} ms`)

    if (error instanceof Error) {
      console.error(`[${requestId}] Nazwa błędu:`, error.name)
      console.error(`[${requestId}] Treść błędu:`, error.message)
      console.error(`[${requestId}] Szczegóły:`, error.stack)
    } else {
      console.error(`[${requestId}] Nieznany błąd:`, error)
    }

    log(requestId, '========================================')

    return c.json({
      error: 'An error occurred while communicating with Gemini',
      requestId,
    }, 500)
  }
})



app.post('/api/search', async (c) => {
  const requestId = crypto.randomUUID();

  try {
    const body = await c.req.json();
    const { message } = body;

    log(requestId, `Otrzymano ${Array.isArray(message) ? message.length + ' składników' : 'nieprawidłowe dane'}`);

    // Walidacja
    if (
      !Array.isArray(message) ||
      message.length === 0 ||
      !message.every(item => typeof item === 'string' && item.trim().length > 0)
    ) {
      return c.json({
        error: 'Message must be a non-empty array of ingredients',
      }, 400);
    }

    // Normalizacja składników użytkownika
    const normalize = (value: string) =>
      value.trim()
        .toLocaleLowerCase('pl-PL')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const userIngredients = new Set(message.map(normalize));

    // Pobranie wszystkich przepisów i ich składników wyszukiwawczych
    const recipes = db.query(`
      SELECT
        r.id,
        r.title,
        hi.name AS hidden_ingredient
      FROM recipes r
      INNER JOIN hidden_ingredients hi
        ON hi.recipe_id = r.id
      ORDER BY r.id, hi.position
    `).all() as {
      id: number;
      title: string;
      hidden_ingredient: string;
    }[];

    // Grupowanie składników według przepisów
    const groupedRecipes = new Map<number, {
      id: number;
      title: string;
      hiddenIngredients: Set<string>;
    }>();

    for (const row of recipes) {
      if (!groupedRecipes.has(row.id)) {
        groupedRecipes.set(row.id, {
          id: row.id,
          title: row.title,
          hiddenIngredients: new Set(),
        });
      }

      groupedRecipes.get(row.id)!.hiddenIngredients.add(
        normalize(row.hidden_ingredient)
      );
    }

    // Obliczanie liczby brakujących składników
    const matchingRecipes = [...groupedRecipes.values()]
      .map(recipe => {
        const missingCount = [...recipe.hiddenIngredients]
          .filter(ingredient => !userIngredients.has(ingredient))
          .length;

        return {
          ...recipe,
          missingCount,
        };
      })
      .sort((a, b) =>
        a.missingCount - b.missingCount ||
        a.title.localeCompare(b.title, 'pl')
      );

    // Pobieranie pełnych danych przepisów z bazy
    const getIngredients = db.query(`
      SELECT name
      FROM ingredients
      WHERE recipe_id = ?
      ORDER BY position
    `);

    const getSimpleIngredients = db.query(`
      SELECT name
      FROM hidden_ingredients
      WHERE recipe_id = ?
      ORDER BY position
    `);

    const getSteps = db.query(`
      SELECT content
      FROM steps
      WHERE recipe_id = ?
      ORDER BY position
    `);

    const results = matchingRecipes.map(recipe => ({
      tytuł: recipe.title,
      składniki: getIngredients.all(recipe.id).map((item: any) => item.name),  
      "składniki proste": getSimpleIngredients.all(recipe.id).map((item: any) => item.name),
      kroki: getSteps.all(recipe.id).map((item: any) => item.content),
    }));

    log(requestId, `Znaleziono ${results.length} przepisów:\n${JSON.stringify(results)}`);

    return c.json({
      response: JSON.stringify(results),
    });

  } catch (error) {
    log(requestId, `BŁĄD: ${String(error)}`);

    return c.json({
      error: 'Wystąpił błąd podczas wyszukiwania przepisów.',
    }, 500);
  }
});



export default app
