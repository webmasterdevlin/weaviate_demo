type JeopardyItem = {
  Answer: string;
  Question: string;
  Category: string;
  Vector: number[];
};

export async function getJsonData(): Promise<JeopardyItem[]> {
  const file = await fetch(
    "https://raw.githubusercontent.com/weaviate-tutorials/quickstart/main/data/jeopardy_tiny+vectors.json"
  );
  return file.json() as unknown as JeopardyItem[];
}
