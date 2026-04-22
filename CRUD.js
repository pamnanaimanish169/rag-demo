// READ
// import { ChromaClient } from "chromadb";

// const client = new ChromaClient({ path: 'http://localhost:8000' });
// const collection = await client.getCollection({ name: 'rag-demo' });

// const data = await collection.get({
//   include: ["documents", "metadatas"]
// });

// console.dir(data, { depth: null });

// CREATE
// import { ChromaClient } from "chromadb";

// const client = new ChromaClient({ path: 'http://localhost:8000' });

// async function main() {
//   const collection = await client.getOrCreateCollection({
//     name: "rag-demo"
//   });

//   await collection.add({
//     ids: ["101"],
//     documents: ["ChromaDB CRUD example document"],
//     metadatas: [{ source: "manual", topic: "crud" }]
//   });

//   console.log("Created record 101")
// }

// main().catch(console.error)

// READ (ALL)
// import { ChromaClient } from "chromadb";

// const client = new ChromaClient({ path: 'http://localhost:8000' });

// async function main() {
//   const collection = await client.getOrCreateCollection({
//     name: "rag-demo"
//   });

//   const all = await collection.get({
//     include: ["documents", "metadatas"]
//   });

//   console.log("\nRead record:");
//   console.dir(all, { depth: null });
// }

// main().catch(console.error)

// READ (ONE)
// import { ChromaClient } from "chromadb";

// const client = new ChromaClient({ path: 'http://localhost:8000' });

// async function main() {
//   const collection = await client.getOrCreateCollection({
//     name: "rag-demo"
//   });

//   const one = await collection.get({
//     ids: ["101"],
//     include: ["documents", "metadatas"]
//   });

//   console.log("\nRead record:");
//   console.dir(one, { depth: null });
// }

// main().catch(console.error)

// UPDATE
// import { ChromaClient } from "chromadb";

// const client = new ChromaClient({ path: 'http://localhost:8000' });

// async function main() {
//   const collection = await client.getOrCreateCollection({
//     name: "rag-demo"
//   });

//   await collection.update({
//     ids: ["101"],
//     documents: ["ChromaDB CRUD example document updated"],
//     metadatas: [{ source: "manual", topic: "crud-updated" }]
//   });

//   const updated = await collection.get({
//     ids: ["101"],
//     include: ["documents", "metadatas"]
//   });

//   console.log("\nRead updated record:");
//   console.dir(updated, { depth: null });
// }

// main().catch(console.error);

// DELETE
// import { ChromaClient } from "chromadb";

// const client = new ChromaClient({ path: 'http://localhost:8000' });

// async function main() {
//   const collection = await client.getOrCreateCollection({
//     name: "rag-demo"
//   });

//   await collection.delete({
//     ids: ["101"]
//   });

//   console.log("\Deleted record 101");

//   const afterDelete = await collection.get({
//     ids: ["101"],
//     include: ["documents", "metadatas"]
//   });

//   console.log("\nAfter delete:");
//   console.dir(afterDelete, { depth: null });
// }

// main().catch(console.error);