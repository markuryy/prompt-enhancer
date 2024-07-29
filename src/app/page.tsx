"use client";
import { Title, Text, Stack, TextInput, Button, Paper, Select, Center, Container } from "@mantine/core";
import { useState, useEffect } from "react";
import presets from "@/data/presets.json";

export default function Home() {
  const [input, setInput] = useState("");
  const [enhancedInput, setEnhancedInput] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("SD1.5");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  const enhancePrompt = async () => {
    if (!input.trim()) return;
    setIsEnhancing(true);
    setCanUndo(true);

    try {
      const response = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, preset: selectedPreset }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let enhancedText = "";

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        const chunk = decoder.decode(value);
        enhancedText += chunk;
        setEnhancedInput(enhancedText);
      }
    } catch (error) {
      console.error("Error:", error);
      setEnhancedInput("Sorry, I encountered an error.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const undoEnhancement = () => {
    setEnhancedInput(input);
    setCanUndo(false);
  };

  useEffect(() => {
    setCanUndo(enhancedInput !== input && enhancedInput !== "");
  }, [input, enhancedInput]);

  return (
    <Container size="md">
      <Stack align="stretch" justify="center" h="100vh" spacing="md">
        <Title order={1} align="center">AI Prompt Enhancer</Title>
        
        <Center>
          <Paper withBorder p="md" style={{ width: "100%", maxWidth: "600px" }}>
            <Stack spacing="md">
              <Select
                label="Select Preset"
                data={Object.keys(presets).map(key => ({ value: key, label: key }))}
                value={selectedPreset}
                onChange={(value) => setSelectedPreset(value as string)}
              />
              <TextInput
                label="Enter your prompt"
                placeholder="Type your prompt here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <Text weight={700}>Enhanced Prompt:</Text>
              <Paper withBorder p="xs" style={{ minHeight: "100px" }}>
                <Text>{enhancedInput || "Your enhanced prompt will appear here"}</Text>
              </Paper>
              <Stack direction="row" spacing="xs">
                <Button onClick={enhancePrompt} loading={isEnhancing}>
                  {isEnhancing ? "Enhancing..." : "Enhance"}
                </Button>
                <Button onClick={undoEnhancement} disabled={!canUndo}>
                  Undo
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Center>
      </Stack>
    </Container>
  );
}
