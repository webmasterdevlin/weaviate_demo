import weaviate, { ObjectsBatcher } from "weaviate-ts-client";
import { getJsonData } from "./service";
import { vector_data } from "./vector";

const client = weaviate.client({
  scheme: "http",
  host: "localhost:8080",
});

export async function getWeaviateClient() {
  try {
    /* Connect to Weaviate */
    const testClientResponse = await client.schema.getter().do();
    console.log(JSON.stringify(testClientResponse, null, 2));

    const className = "Question";
    await client.schema.classDeleter().withClassName(className).do();
    const classObj = {
      class: className,
      vectorizer: "none",
    };

    /* Collection definition */

    // Uncomment to delete all Question objects if you see a "Name 'Question' already used" error
    // await client.schema.classDeleter().withClassName(className).do();

    // Add the class to the schema
    await client.schema.classCreator().withClass(classObj).do();

    /* Import data with vectors */
    // Get the questions directly from the URL
    const data = await getJsonData();

    // Prepare a batcher. Even though this dataset is tiny, this is the best practice for import.
    let batcher: ObjectsBatcher = client.batch.objectsBatcher();
    let counter: number = 0;
    let batchSize: number = 100;

    for (const item of data) {
      // Construct the object to add to the batch
      const obj = {
        class: className,
        properties: {
          answer: item.Answer,
          question: item.Question,
          category: item.Category,
        },
        vector: item.Vector,
      };

      // add the object to the batch queue
      batcher = batcher.withObject(obj);

      // When the batch counter reaches batchSize, push the objects to Weaviate
      if (counter++ % batchSize === 0) {
        // Flush the batch queue and restart it
        await batcher.do();
        batcher = client.batch.objectsBatcher();
      }
    }

    // Flush the remaining objects
    await batcher.do();
    console.log(`Finished importing ${counter} objects.`);

    /* Query */

    const response = await client.graphql
      .get()
      .withClassName(className)
      .withFields("question answer category _additional {distance}")
      .withNearVector({
        vector: vector_data,
      })
      .withLimit(2)
      .do();

    console.log(response["data"]["Get"][className]);
  } catch (error: any) {
    throw new Error("Sorry, something went wrong." + error.message);
  }
}

getWeaviateClient()
  .then(() => {
    console.log("Done");
  })
  .catch((error) => {
    console.error(error);
  });
