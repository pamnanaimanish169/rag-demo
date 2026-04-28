# RAG Local (Ubuntu)

A local Retrieval-Augmented Generation (RAG) pipeline that runs entirely on your machine. It uses **ChromaDB** as the vector store and **Ollama** to serve both embedding and chat models — no cloud APIs required.

## How It Works

1. Documents (or scraped web pages) are embedded and stored in ChromaDB.
2. When a question is asked, the query is embedded and the most semantically similar chunks are retrieved from ChromaDB.
3. The retrieved chunks are passed as context to a local Ollama LLM, which generates the final answer.

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Docker](https://docs.docker.com/get-docker/) (to run ChromaDB)
- [Ollama](https://ollama.com/download) installed and running locally

---

## Setup

### 1. Start ChromaDB

Run ChromaDB as a Docker container:

```bash
docker run -p 8000:8000 chromadb/chroma
```

ChromaDB will be available at `http://localhost:8000`.

### 2. Install and Start Ollama

Install Ollama from [https://ollama.com/download](https://ollama.com/download), then pull the required models:

```bash
# Embedding model
ollama pull chroma/all-minilm-l6-v2-f32

# Chat / LLM model
ollama pull llama3.2
```

Ollama starts automatically and listens on `http://localhost:11434`.

### 3. Install Node Dependencies

```bash
npm install
```

### 4. Install Playwright Browsers

The web crawler (`extract-from-url.js`) uses Playwright. Install the Chromium browser it needs:

```bash
npx playwright install chromium
```

### 5. Configure Environment Variables

Copy the example below into a `.env` file in the project root (one is already included):

```env
OLLAMA_HOST=http://localhost:11434
CHROMA_HOST=http://localhost:8000
OLLAMA_EMBED_MODEL=chroma/all-minilm-l6-v2-f32
OLLAMA_CHAT_MODEL=llama3.2
```

Adjust the values if your services run on different hosts or ports.

---

## Usage

### Run the Basic RAG Demo

Embeds a small set of hardcoded notes into ChromaDB and answers a question using retrieved context:

```bash
node app.js
```

### Crawl a Website and Build a Knowledge Base

Crawls all internal pages of a site (defaults to `https://cheerio.js.org/`), chunks the content, and stores it in ChromaDB:

```bash
node extract-from-url.js
```

Edit the `HOMEPAGE` and `MAX_PAGES` constants at the top of the file to target a different site.

### Query the Knowledge Base

Retrieves relevant chunks from the stored collection and sends them to Ollama for an answer:

```bash
node query-from-rag.js
```

Edit the `queryTexts` and the user `content` prompt inside the file to ask your own questions.

### ChromaDB CRUD Examples

`CRUD.js` contains commented-out snippets showing how to create, read, update, and delete documents in a ChromaDB collection. Uncomment the relevant block and run:

```bash
node CRUD.js
```

---

## Project Structure

| File | Purpose |
|---|---|
| `app.js` | End-to-end RAG demo with hardcoded notes |
| `extract-from-url.js` | Web crawler that scrapes a site and stores chunks in ChromaDB |
| `query-from-rag.js` | Query an existing ChromaDB collection via Ollama |
| `CRUD.js` | Utility snippets for ChromaDB create / read / update / delete |
| `.env` | Environment variables for service hosts and model names |

---

## Tech Stack

| Tool | Role |
|---|---|
| [ChromaDB](https://www.trychroma.com/) | Vector database — stores and retrieves embeddings |
| [Ollama](https://ollama.com/) | Runs LLM and embedding models locally |
| [Playwright](https://playwright.dev/) | Headless browser for web crawling |
| [LangChain Text Splitters](https://js.langchain.com/docs/modules/data_connection/document_transformers/) | Splits scraped text into overlapping chunks |
| [dotenv](https://github.com/motdotla/dotenv) | Loads environment variables from `.env` |

very time you open a new terminal to work on this project, activate it first with:

python3 -m venv .venv
source .venv/bin/activate