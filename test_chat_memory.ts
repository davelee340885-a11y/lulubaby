import { getPersonaById } from './server/db';
import { createMemoryService } from './server/services/memoryService';

async function test() {
  console.log("Testing chat memory integration...");
  
  // Get persona
  const persona = await getPersonaById(1);
  if (!persona) {
    console.log("Persona not found");
    return;
  }
  
  console.log("Persona userId:", persona.userId);
  
  // Test memory service with persona.userId
  const memoryService = createMemoryService(persona.userId);
  const query = "張先生對醫療保險有什麼需求";
  console.log("Query:", query);
  
  const memories = await memoryService.getContextualMemories(query, 5);
  console.log("Result length:", memories.length);
  console.log("Result:", memories);
}

test().catch(console.error);
