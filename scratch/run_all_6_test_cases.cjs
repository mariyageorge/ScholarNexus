const http = require("http");

function runTest(name, payload) {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify(payload);
    const req = http.request(
      "http://localhost:8080/api/ai/writing-assist",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(dataString),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(body);
            resolve({ name, json });
          } catch (e) {
            resolve({ name, error: body });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(dataString);
    req.end();
  });
}

async function runAll() {
  console.log("==========================================================================");
  console.log("RUNNING STRICT GROUNDING & SECTION ACTION TEST SUITE (6 COMPLETE TESTS)");
  console.log("==========================================================================\n");

  // TEST 1: Existing Methodology + "Elaborate Technical Details"
  const res1 = await runTest("TEST 1: Existing Methodology -> Elaborate Technical Details", {
    action: "expand_section",
    content: "The proposed system uses Convolutional Neural Networks (CNNs) to classify crop diseases from uploaded plant leaf images.",
    sectionTitle: "2. Proposed System / Methodology",
    documentType: "Conference Paper",
    workTitle: "AI-Based Crop Disease Detection Conference Paper",
    projectTitle: "AI-Based Crop Disease Detection Using Deep Learning",
    projectAbstract: "Developing deep learning for crop disease identification from leaf images."
  });
  console.log(`[${res1.name}]`);
  console.log("SUGGESTION:\n", res1.json.suggestion, "\n--------------------------------------------------------------------------\n");

  // TEST 2: Empty Methodology + "Elaborate Technical Details"
  const res2 = await runTest("TEST 2: Empty Methodology -> Elaborate Technical Details", {
    action: "expand_section",
    content: "",
    sectionTitle: "2. Proposed System / Methodology",
    documentType: "Conference Paper",
    workTitle: "AI-Based Crop Disease Detection Conference Paper",
    projectTitle: "AI-Based Crop Disease Detection Using Deep Learning",
    projectAbstract: "Developing deep learning for crop disease identification."
  });
  console.log(`[${res2.name}]`);
  console.log("SUGGESTION:\n", res2.json.suggestion, "\n--------------------------------------------------------------------------\n");

  // TEST 3: Empty Experimental Evaluation + "Improve Presentation of Findings & Analysis"
  const res3a = await runTest("TEST 3a: Empty Experimental Evaluation -> Improve Presentation of Findings", {
    action: "improve_results_presentation",
    content: "",
    sectionTitle: "3. Experimental Evaluation",
    documentType: "Conference Paper",
    workTitle: "AI-Based Crop Disease Detection Conference Paper",
    projectTitle: "AI-Based Crop Disease Detection Using Deep Learning",
    projectAbstract: "Developing deep learning for crop disease identification."
  });
  console.log(`[${res3a.name}]`);
  console.log("SUGGESTION:\n", res3a.json.suggestion, "\n--------------------------------------------------------------------------\n");

  // TEST 3b: Empty Experimental Evaluation + "Improve Academic Writing & Clarity"
  const res3b = await runTest("TEST 3b: Empty Experimental Evaluation -> Improve Academic Writing", {
    action: "improve_writing",
    content: "",
    sectionTitle: "3. Experimental Evaluation",
    documentType: "Conference Paper",
    workTitle: "AI-Based Crop Disease Detection Conference Paper",
    projectTitle: "AI-Based Crop Disease Detection Using Deep Learning",
    projectAbstract: "Developing deep learning for crop disease identification."
  });
  console.log(`[${res3b.name}]`);
  console.log("SUGGESTION:\n", res3b.json.suggestion, "\n--------------------------------------------------------------------------\n");

  // TEST 4: Empty Experimental Evaluation + "Elaborate Interpretation (Preserving Data)"
  const res4 = await runTest("TEST 4: Empty Experimental Evaluation -> Elaborate Interpretation", {
    action: "elaborate_discussion",
    content: "",
    sectionTitle: "3. Experimental Evaluation",
    documentType: "Conference Paper",
    workTitle: "AI-Based Crop Disease Detection Conference Paper",
    projectTitle: "AI-Based Crop Disease Detection Using Deep Learning",
    projectAbstract: "Developing deep learning for crop disease identification."
  });
  console.log(`[${res4.name}]`);
  console.log("SUGGESTION:\n", res4.json.suggestion, "\n--------------------------------------------------------------------------\n");

  // TEST 5: Empty Experimental Evaluation + "Generate Results & Analysis Outline"
  const res5 = await runTest("TEST 5: Empty Experimental Evaluation -> Generate Results & Analysis Outline", {
    action: "generate_outline",
    content: "",
    sectionTitle: "3. Experimental Evaluation",
    documentType: "Conference Paper",
    workTitle: "AI-Based Crop Disease Detection Conference Paper",
    projectTitle: "AI-Based Crop Disease Detection Using Deep Learning",
    projectAbstract: "Developing deep learning for crop disease identification."
  });
  console.log(`[${res5.name}]`);
  console.log("SUGGESTION:\n", res5.json.suggestion, "\n--------------------------------------------------------------------------\n");

  // TEST 6: Existing Abstract + "Improve Academic Writing"
  const res6 = await runTest("TEST 6: Existing Abstract -> Improve Academic Writing", {
    action: "improve_writing",
    content: "Crop diseases cause big issues in farming. We make a system using CNN to find plant leaf diseases from pictures. It helps farmers know what disease is on the crop quickly.",
    sectionTitle: "Abstract",
    documentType: "Conference Paper",
    workTitle: "AI-Based Crop Disease Detection Conference Paper",
    projectTitle: "AI-Based Crop Disease Detection Using Deep Learning",
    projectAbstract: "Developing deep learning for crop disease identification."
  });
  console.log(`[${res6.name}]`);
  console.log("SUGGESTION:\n", res6.json.suggestion, "\n==========================================================================");
}

runAll().catch(console.error);
