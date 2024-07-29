"use client";
import { Title, Text, Stack, TextInput, Button, Paper, ScrollArea } from "@mantine/core";
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error." }]);
    }
  };

  return (
    <Stack align="stretch" justify="flex-start" h="100vh" spacing="md" p="md">
      <Title order={1} align="center">Chat with Groq AI</Title>
      
      <ScrollArea h={400}>
        <Stack spacing="xs">
          {messages.map((msg, index) => (
            <Paper key={index} p="xs" withBorder>
              <Text weight={700}>{msg.role === "user" ? "You" : "AI"}:</Text>
              <Text>{msg.content}</Text>
            </Paper>
          ))}
        </Stack>
      </ScrollArea>
      
      <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
        <Stack spacing="xs">
          <TextInput
            placeholder="Type your message here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit">Send</Button>
        </Stack>
      </form>
    </Stack>
  );
}
