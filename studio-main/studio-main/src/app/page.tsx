import { RasaGraderClient } from '@/components/rasa-grader-client';
import { generateTasteGrade } from '@/ai/flows/generate-taste-grade';

export default async function Home() {
  // We pass null to the client and let it handle the initial state.
  return <RasaGraderClient initialGrade={null} />;
}
