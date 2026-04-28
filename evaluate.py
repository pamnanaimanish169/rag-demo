import json
import chromadb
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
import ollama
from datasets import Dataset
from ragas import evaluate
# from ragas.metrics import faithfulness, answer_relevancy, context_precision
from ragas.metrics.collections import faithfulness, answer_relevancy, context_precision
from langchain_ollama import ChatOllama, OllamaEmbeddings

CHROMA_HOST = "http://localhost:8000"
COLLECTION_NAME = "cheerio-js-org"
OLLAMA_CHAT_MODEL = "llama3.2"
N_RESULTS = 3

with open("test-set.json", "r") as f:
    test_set = json.load(f)

client = chromadb.HttpClient(host="localhost", port=8000)
embedding_fn = DefaultEmbeddingFunction()
collection = client.get_collection(name=COLLECTION_NAME, embedding_function=embedding_fn)

def run_rag(question):
    results = collection.query(
        query_texts=[question],
        n_results=N_RESULTS,
        include=["documents"]
    )
    contexts = results["documents"][0]
    context = "\n\n".join(contexts)

    response = ollama.chat(
        model=OLLAMA_CHAT_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant. Answer the user's question using only the provided context."
            },
            {
                "role": "user",
                "content": f"Context:\n{context}\n\nQuestion: {question}"
            }
        ]
    )
    return {
        "answer": response["message"]["content"],
        "contexts": contexts
    }

questions = []
ground_truths = []
answers = []
contexts = []

for i, item in enumerate(test_set):
    print(f"[{i+1}/{len(test_set)}] {item['question']}")
    result = run_rag(item["question"])
    questions.append(item["question"])
    ground_truths.append(item["ground_truth"])
    answers.append(result["answer"])
    contexts.append(result["contexts"])

dataset = Dataset.from_dict({
    "question":     questions,
    "answer":       answers,
    "contexts":     contexts,
    "ground_truth": ground_truths,
})

# llm = ChatOllama(model=OLLAMA_CHAT_MODEL)
llm = ChatOllama(
    model=OLLAMA_CHAT_MODEL,
    temperature=0,
    format="json",
    timeout=300
)

embeddings = OllamaEmbeddings(model="nomic-embed-text")

metrics = [
    faithfulness,
    answer_relevancy,
    context_precision
]

for m in metrics:
    m.llm        = llm
    m.embeddings = embeddings

results = evaluate(dataset, metrics=metrics, raise_exceptions=False, max_workers=1)

print("\n── RAGAS Scores ──────────────────────────────")
print(results)
print("\n── Per-question breakdown ────────────────────")
print(results.to_pandas().to_string())

results.to_pandas().to_csv("baseline-scores.csv", index=False)
print("\nSaved to baseline-scores.csv")