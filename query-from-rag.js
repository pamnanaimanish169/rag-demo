import { ChromaClient, DefaultEmbeddingFunction } from "chromadb";
import ollama from "ollama";

async function main() {
  const client = new ChromaClient({ path: "http://localhost:8000" });
  const embeddingFunction = new DefaultEmbeddingFunction();

  const collection = await client.getCollection({
    name: "cheerio-js-org",
    embeddingFunction,
  });


  const results = await collection.query({
    queryTexts: ["how to load documents with Cheerio?"],
    nResults: 3,
    include: ["documents", "metadatas"],
  });

//   Pass the store values in the database as the context to the Ollama for chatbot type experience
  const context = results.documents[0].join("\n\n");

  const response = await ollama.chat({
    model: "llama3.2:latest",
    messages: [
        {
            role: "system",
            content: "You are a helpful assistant. Answer the user's question using only the provided context,"
        },
        {
            role: "user",
            content: `Context:\n${context}\n\nQuestion: Explan me about contains() function.?`
        }
    ]
  })

  console.log(response.message.content,'response')
}

main().catch(console.error);