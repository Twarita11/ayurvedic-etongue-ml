import { RasaGraderClient } from '@/components/rasa-grader-client';

export default async function Home() {
  // We pass null to the client and let it handle the initial state.
  return <RasaGraderClient initialGrade={null} />;
}
