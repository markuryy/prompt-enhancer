"use client";
import { Box, Title, Stack, Textarea, Button, Paper, Select, Center, Container } from "@mantine/core";
import { useState, useRef, useEffect } from "react";
import presets from "@/data/presets.json";

export default function Home() {
  const [input, setInput] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("SD1.5");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const enhancePrompt = async () => {
    if (!input.trim()) return;
    setIsEnhancing(true);

    try {
      const response = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, preset: selectedPreset }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setInput((prev) => prev + chunk);
      }
    } catch (error) {
      console.error("Error:", error);
      setInput((prev) => prev + "\n\nSorry, I encountered an error.");
    } finally {
      setIsEnhancing(false);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <Container size="md">
      <Stack align="stretch" justify="center" h="100vh" fw="md">
        <Box ta="center">
          <Title order={1}>AI Prompt Enhancer</Title>
        </Box>
        
        <Center>
          <Paper withBorder p="md" style={{ width: "100%", maxWidth: "600px" }}>
            <Stack gap="md">
              <Select
                label="Select Preset"
                data={Object.keys(presets).map(key => ({ value: key, label: key }))}
                value={selectedPreset}
                onChange={(value) => setSelectedPreset(value as string)}
              />
              <Textarea
                ref={textareaRef}
                label="Enter your prompt"
                placeholder="Type your prompt here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                minRows={5}
                autosize
              />
              <Button onClick={enhancePrompt} loading={isEnhancing} fullWidth>
                {isEnhancing ? "Enhancing..." : "Enhance"}
              </Button>
            </Stack>
          </Paper>
        </Center>
      </Stack>
    </Container>
  );
}
