"use client";
import { Box, Title, Stack, Textarea, Button, Paper, Select, Center, Container, Text, Modal, TextInput, Tooltip, Group } from "@mantine/core";
import { useState, useRef, useEffect } from "react";
import presets from "@/data/presets.json";
import Groq from "groq-sdk";
import { ErrorBoundary } from "react-error-boundary";
import { useApiKey } from "@/utils/apiKeyManager";
import { TbHorse, TbStars, TbArrowBack, TbSettings } from "react-icons/tb";
import { LuSparkles } from "react-icons/lu";

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
  const [isScore9Active, setIsScore9Active] = useState(false);

  useEffect(() => {
    if (!apiKey) {
      setIsApiKeyModalOpen(true);
    }
  }, [apiKey]);

  const toggleScore9 = () => {
    setIsScore9Active(!isScore9Active);
    setInput(prev => {
      const score9Text = "score_9, score_8_up, score_7_up, score_6_up, score_5_up, score_4_up, ";
      if (isScore9Active) {
        return prev.replace(score9Text, "");
      } else {
        return score9Text + prev;
      }
    });
  };

  const enhancePrompt = async () => {
    if (!input.trim() || !apiKey) return;
    setIsEnhancing(true);
    setPreviousInput(input);
    setInput("");

    try {
      const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
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
                <Group justify="center">
                  <Tooltip label="Enhance">
                    <Button onClick={enhancePrompt} loading={isEnhancing} disabled={!apiKey}>
                      <LuSparkles />
                    </Button>
                  </Tooltip>
                  <Tooltip label="Undo">
                    <Button onClick={undoEnhancement} disabled={!previousInput} variant="outline">
                      <TbArrowBack />
                    </Button>
                  </Tooltip>
                  <Tooltip label="Settings">
                    <Button onClick={() => setIsSettingsOpen(true)} variant="outline">
                      <TbSettings />
                    </Button>
                  </Tooltip>
                  <Tooltip label="Toggle Score 9">
                    <Button onClick={toggleScore9} variant={isScore9Active ? "filled" : "outline"}>
                      <TbStars />
                    </Button>
                  </Tooltip>
                  <Tooltip label="Pony">
                    <Button variant="outline">
                      <TbHorse />
                    </Button>
                  </Tooltip>
                </Group>
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
