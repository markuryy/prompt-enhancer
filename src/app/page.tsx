"use client";
import { Box, Title, Stack, Textarea, Button, Paper, Center, Container, Text, Modal, TextInput, Tooltip, Group, ActionIcon } from "@mantine/core";
import { useState, useRef, useEffect } from "react";
import presets from "@/data/presets.json";
import Groq from "groq-sdk";
import { ErrorBoundary } from "react-error-boundary";
import { useApiKey } from "@/utils/apiKeyManager";
import { TbHorse, TbArrowBack, TbSettings, TbChevronDown } from "react-icons/tb";
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
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [customPreset, setCustomPreset] = useState("");

  useEffect(() => {
    if (!apiKey) {
      setIsApiKeyModalOpen(true);
    } else {
      setIsApiKeyModalOpen(false);
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
          { role: "system", content: selectedPreset === "Custom" ? customPreset : presets[selectedPreset as keyof typeof presets] },
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
        <Box component="header" h={60} p="xs">
          <Group justify="space-between" style={{ height: '100%' }}>
            <Title order={3}>AI Prompt Enhancer</Title>
            <Tooltip label="Settings">
              <ActionIcon onClick={() => setIsSettingsOpen(true)} variant="subtle">
                <TbSettings size="1.2rem" />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Box>
        
        <Stack align="stretch" justify="center" h="calc(100vh - 60px)" fw="md">
          <Group justify="center" align="center">
            <Text>Optimize prompt for</Text>
            <Button onClick={() => setIsPresetModalOpen(true)} rightSection={<TbChevronDown />} variant="subtle">
              {selectedPreset}
            </Button>
          </Group>
          
          <Center>
            <Paper withBorder p="md" style={{ width: "100%", maxWidth: "800px" }}>
              <Stack gap="md">
                <Textarea
                  ref={textareaRef}
                  label="Enter your prompt"
                  placeholder="Type your prompt here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  minRows={10}
                  autosize
                />
                <Group justify="center">
                  <Tooltip label="Toggle Score 9">
                    <Button onClick={toggleScore9} variant={isScore9Active ? "filled" : "outline"}>
                      <TbHorse />
                    </Button>
                  </Tooltip>
                  <Button onClick={enhancePrompt} loading={isEnhancing} disabled={!apiKey} leftSection={<LuSparkles />} size="lg">
                    Enhance
                  </Button>
                  <Tooltip label="Undo">
                    <Button onClick={undoEnhancement} disabled={!previousInput} variant="outline">
                      <TbArrowBack />
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

      <Modal opened={isPresetModalOpen} onClose={() => setIsPresetModalOpen(false)} title="Select Preset">
        <Stack>
          {Object.keys(presets).map(key => (
            <Button
              key={key}
              onClick={() => {
                setSelectedPreset(key);
                setIsPresetModalOpen(false);
              }}
              variant={selectedPreset === key ? "filled" : "light"}
            >
              {key}
            </Button>
          ))}
          <Button
            onClick={() => {
              setSelectedPreset("Custom");
              setIsPresetModalOpen(false);
            }}
            variant={selectedPreset === "Custom" ? "filled" : "light"}
          >
            Custom
          </Button>
          {selectedPreset === "Custom" && (
            <Textarea
              label="Custom Preset"
              value={customPreset}
              onChange={(e) => setCustomPreset(e.currentTarget.value)}
              minRows={5}
              placeholder="Enter your custom system prompt here..."
            />
          )}
        </Stack>
      </Modal>
    </ErrorBoundary>
  );
}
