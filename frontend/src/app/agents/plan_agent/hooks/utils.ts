import { Client } from "@langchain/langgraph-sdk";

export const createClient = () => {
  const apiUrl = process.env.NEXT_PUBLIC_LANGGRAPH_API_URL ?? "http://localhost:54367";
  return new Client({
    apiUrl,
  });
};
