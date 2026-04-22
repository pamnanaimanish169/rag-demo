import "dotenv/config";
import { ChromaClient } from "chromadb";

const CHROMA_HOST = process.env.CHROMA_HOST || "http://localhost:8000";
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "chroma/all-minilm-l6-v2-f32";
const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || "llama3.2";

const chroma = new ChromaClient({ path: CHROMA_HOST });

const docs = [
  {
    id: "1",
    text: "ChromaDB stores embeddings and supports semantic search for RAG applications.",
    metadata: { source: "note", topic: "chroma" }
  },
  {
    id: "2",
    text: "Ollama can run embedding models locally and expose them through an HTTP API.",
    metadata: { source: "note", topic: "ollama" }
  },
  {
    id: "3",
    text: "RAG retrieves relevant chunks first, then passes them to the language model as context.",
    metadata: { source: "note", topic: "rag" }
  },
  {
    id: "4",
    text: "In this setup, Ollama creates embeddings for documents and queries, Chroma stores those embeddings and retrieves the closest matches, and the retrieved text is sent back to Ollama for the final answer.",
    metadata: { source: "explanation", topic: "rag-integration" }
  }
];

async function ollamaEmbed(texts) {
  const res = await fetch(`${OLLAMA_HOST}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: texts
    })
  });

  if (!res.ok) throw new Error(`Embed failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.embeddings;
}

async function ollamaChat(prompt) {
  const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CHAT_MODEL,
      stream: false,
      messages: [
        {
          role: "system",
          content: "Answer only from the provided context. If the answer is missing, say you don't know."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!res.ok) throw new Error(`Chat failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.message?.content || "";
}

async function setupCollection() {
  try {
    await chroma.deleteCollection({ name: "rag-demo" });
  } catch {}

  const collection = await chroma.createCollection({ name: "rag-demo" });
  const embeddings = await ollamaEmbed(docs.map(d => d.text));

  await collection.add({
    ids: docs.map(d => d.id),
    documents: docs.map(d => d.text),
    metadatas: docs.map(d => d.metadata),
    embeddings
  });

  return collection;
}

async function ask(question) {
  const collection = await chroma.getCollection({ name: "rag-demo" });
  const [queryEmbedding] = await ollamaEmbed([question]);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: 3
  });

  const contextDocs = results.documents?.[0] || [];
  const context = contextDocs.join("\n\n");

  const answer = await ollamaChat(`Context:\n${context}\n\nQuestion: ${question}`);

  return { answer, contextDocs };
}

async function main() {
  await setupCollection();

  const question = "How does RAG use ChromaDB";
  const result = await ask(question);

  console.log("\nQuestion:", question);
  console.log("\nRetrieved context:");
  console.log(result.contextDocs);
  console.log("\nAnswer:");
  console.log(result.answer);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});