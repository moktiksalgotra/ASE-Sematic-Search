import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 120000,
});

export const ingestPapers = async (topic, maxResults = 30) => {
  const { data } = await api.post("/ingest", {
    topic,
    max_results: Number(maxResults),
  });
  return data;
};

export const searchPapers = async ({ query, filters }) => {
  const { data } = await api.post("/search", { query, filters });
  return data;
};

export const listPapers = async () => {
  const { data } = await api.get("/papers");
  return data;
};

export const summarizePaper = async (paper) => {
  const { data } = await api.post("/summarize", {
    title: paper.title,
    authors: paper.authors,
    year: Number(paper.year),
    domain: paper.domain,
    abstract: paper.abstract || paper.abstract_snippet || "",
  });
  return data;
};
