"use client";
import { Box, Title, Stack, Textarea, Button, Paper, Select, Center, Container, Text, Modal, TextInput } from "@mantine/core";
import { useState, useRef, useEffect } from "react";
import presets from "@/data/presets.json";
import Groq from "groq-sdk";
import { ErrorBoundary } from "react-error-boundary";
import { useApiKey } from "@/utils/apiKeyManager";

function ErrorFallback({error}: {error: Error}) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
    </div>
  )
}

export default function Home() {
  console.log("Rendering Home component");
  const [input, setInput] = useState("");
  const [previousInput, setPreviousInput] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("SD1.5");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");
  const { apiKey, saveApiKey, removeApiKey } = useApiKey();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (!apiKey) {
      setIsApiKeyModalOpen(true);
    }
  }, [apiKey]);

  const enhancePrompt = async () => {
    if (!input.trim() || !apiKey) return;
    setIsEnhancing(true);
    setPreviousInput(input);
    setInput("");

    try {
      const groq = new Groq({ apiKey });
      const stream = await groq.chat.completions.create({
        messages: [
          { role: "system", content: presets[selectedPreset as keyof typeof presets] },
          { role: "user", content: input },
        ],
        model: "llama3-8b-8192",
        temperature: 0.5,
        max_tokens: 1024,
        top_p: 1,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        setInput((prev) => prev + content);
      }
    } catch (error) {
      console.error("Error:", error);
      setInput("Sorry, I encountered an error.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const undoEnhancement = () => {
    setInput(previousInput);
    setPreviousInput("");
  };

  const handleSaveApiKey = () => {
    saveApiKey(tempApiKey);
    setIsApiKeyModalOpen(false);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
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
                <Stack justify="flex-start" gap="xs">
                  <Button onClick={enhancePrompt} loading={isEnhancing} fullWidth disabled={!apiKey}>
                    {isEnhancing ? "Enhancing..." : "Enhance"}
                  </Button>
                  <Button onClick={undoEnhancement} disabled={!previousInput} variant="outline">
                    Undo
                  </Button>
                  <Button onClick={() => setIsSettingsOpen(true)} variant="outline">
                    Settings
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Center>
        </Stack>
      </Container>

      <Modal opened={isApiKeyModalOpen} onClose={() => {}} title="Enter GROQ API Key" closeOnClickOutside={false} closeOnEscape={false}>
        <Stack>
          <TextInput
            placeholder="Enter your GROQ API Key"
            value={tempApiKey}
            onChange={(e) => setTempApiKey(e.currentTarget.value)}
          />
          <Button onClick={handleSaveApiKey} disabled={!tempApiKey}>
            Save API Key
          </Button>
        </Stack>
      </Modal>

      <Modal opened={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Settings">
        <Stack>
          <Button onClick={() => {
            removeApiKey();
            setIsSettingsOpen(false);
            setIsApiKeyModalOpen(true);
          }}>
            Remove API Key
          </Button>
        </Stack>
      </Modal>
    </ErrorBoundary>
  );
}
