import { createMemoryService } from './server/services/memoryService';

async function test() {
  console.log("Testing memory service...");
  const memoryService = createMemoryService(1);
  
  // Test search
  const query = "張先生對醫療保險有什麼需求";
  console.log("Query:", query);
  
  const memories = await memoryService.getContextualMemories(query, 5);
  console.log("Result length:", memories.length);
  console.log("Result:", memories);
}

test().catch(console.error);
