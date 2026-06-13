const payload = {
  fullName: "Abayomi Dele-Ale",
  professionalSummary: "Lead AI Engineer with extensive experience building real-time microservice telemetry, decentralized active state ledgers, and Gemini integration pipelines. Passionate about automating career matching ecosystems.",
  role: "Lead AI Engineer",
  location: "Lagos, Nigeria",
  skills: ["React", "TypeScript", "Node.js", "LLM Fine-Tuning", "Prompt Engineering", "Firestore", "Docker", "Python", "Cloud Run"],
  yearsOfExperience: 6,
  infrastructureStatus: {
    powerSetupDescription: "Reliable Solar Inverter with 10kVA backup battery (Voice Verified)",
    internetSetupDescription: "Starlink premium subscription + backup 4G LTE router (Voice Verified)",
    hasRemoteBackupPlan: true
  },
  phoneNumber: "2348011223344",
  hasVoiceOnboarded: true
};

async function run() {
  const url = 'https://wa-backend-536473631781.us-central1.run.app/api/users/user_1780714671963_281/update';
  console.log(`Sending POST to ${url}...`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log('Status code:', res.status);
    const data = await res.json();
    console.log('Response body:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
run();
