import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Fab,
  Paper,
  Typography,
  TextField,
  IconButton,
  Stack,
  Chip,
  CircularProgress,
  Slide,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import {
  AGENT_NAME,
  sendChatMessage,
  type ChatMessage,
} from '../../utils/chatbotApi';
import { pokeTextFieldSx } from '../../utils/formFieldStyles';

const POKE_RED = '#C22E28';
const POKE_YELLOW = '#FFCC00';

const GREETING: ChatMessage = {
  role: 'assistant',
  content: `Hey there, trainer! I'm ${AGENT_NAME}, your PokéWorld guide. I can help you find Pokémon, save favorites, explore movies, browse TCG cards and sets — ask me anything about this site!`,
};

const QUICK_PROMPTS = [
  'What is PokéWorld?',
  'How do favorites work?',
  'What can I do on TCG Market?',
];

export default function SiteChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, isLoading, error]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    const priorMessages = messages[0] === GREETING ? messages.slice(1) : messages;
    const history = priorMessages;
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      const reply = await sendChatMessage(trimmed, history);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : `${AGENT_NAME} ran into a hiccup. Please try again.`;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Paper
          elevation={12}
          sx={{
            position: 'fixed',
            bottom: { xs: 88, sm: 96 },
            right: { xs: 16, sm: 24 },
            width: { xs: 'calc(100vw - 32px)', sm: 380 },
            maxWidth: 380,
            height: { xs: 420, sm: 500 },
            borderRadius: 4,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1200,
            border: '1px solid #E5E7EB',
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              background: `linear-gradient(135deg, ${POKE_RED} 0%, #E85D4A 70%, ${POKE_YELLOW} 100%)`,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <SmartToyOutlinedIcon />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                  {AGENT_NAME}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Your PokéWorld guide
                </Typography>
              </Box>
            </Stack>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box
            ref={scrollRef}
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              bgcolor: '#F6F8FC',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            {messages.map((msg, index) => (
              <Box
                key={`${msg.role}-${index}`}
                sx={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    px: 1.75,
                    py: 1.25,
                    borderRadius: 3,
                    bgcolor: msg.role === 'user' ? POKE_RED : '#FFFFFF',
                    color: msg.role === 'user' ? 'white' : '#111827',
                    border: msg.role === 'user' ? 'none' : '1px solid #E5E7EB',
                  }}
                >
                  <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </Typography>
                </Paper>
              </Box>
            ))}

            {isLoading && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
                <CircularProgress size={16} sx={{ color: POKE_RED }} />
                <Typography variant="caption">{AGENT_NAME} is thinking...</Typography>
              </Stack>
            )}

            {error && (
              <Box sx={{ alignSelf: 'flex-start', maxWidth: '90%' }}>
                <Paper
                  elevation={0}
                  sx={{
                    px: 1.75,
                    py: 1.25,
                    borderRadius: 3,
                    bgcolor: '#FFF7ED',
                    border: '1px solid #FDBA74',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 800, color: '#C2410C', display: 'block', mb: 0.5 }}
                  >
                    {AGENT_NAME} is unavailable
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.6, color: '#9A3412' }}>
                    {error}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Box>

          <Box sx={{ px: 2, pt: 1, pb: 1.5, bgcolor: '#FFFFFF', borderTop: '1px solid #E5E7EB' }}>
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
              {QUICK_PROMPTS.map((prompt) => (
                <Chip
                  key={prompt}
                  label={prompt}
                  size="small"
                  clickable
                  disabled={isLoading}
                  onClick={() => sendMessage(prompt)}
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    bgcolor: '#FFF1F2',
                    color: POKE_RED,
                  }}
                />
              ))}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="flex-end">
              <TextField
                fullWidth
                size="small"
                placeholder={`Ask ${AGENT_NAME} about PokéWorld...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                disabled={isLoading}
                multiline
                maxRows={3}
                sx={pokeTextFieldSx('#F9FAFB')}
              />
              <IconButton
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
                sx={{
                  bgcolor: POKE_RED,
                  color: 'white',
                  '&:hover': { bgcolor: '#B22222' },
                  '&.Mui-disabled': { bgcolor: '#E5E7EB', color: '#9CA3AF' },
                }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
        </Paper>
      </Slide>

      <Fab
        color="primary"
        aria-label={`Chat with ${AGENT_NAME}`}
        onClick={() => setOpen((prev) => !prev)}
        sx={{
          position: 'fixed',
          bottom: { xs: 20, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: 1200,
          bgcolor: POKE_RED,
          '&:hover': { bgcolor: '#B22222' },
        }}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </Fab>
    </>
  );
}
