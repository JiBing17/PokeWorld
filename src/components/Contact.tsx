import React, { useState } from "react";
import { isAxiosError } from "axios";
import Header from "./Header";
import {
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  Link,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import MovieOutlinedIcon from "@mui/icons-material/MovieOutlined";
import CatchingPokemonIcon from "@mui/icons-material/CatchingPokemon";
import CollectionsBookmarkOutlinedIcon from "@mui/icons-material/CollectionsBookmarkOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BugReportOutlinedIcon from "@mui/icons-material/BugReportOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import { apiClient } from '../utils/apiClient';
import { pokeTextFieldSx } from "../utils/formFieldStyles";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string;
}

type StatusType = "success" | "error";

const TOPIC_OPTIONS = [
  { label: "Bug report", icon: <BugReportOutlinedIcon />, subject: "Bug report" },
  { label: "Feedback", icon: <LightbulbOutlinedIcon />, subject: "Feedback" },
  { label: "General question", icon: <HelpOutlineOutlinedIcon />, subject: "General question" },
];

const textFieldSx = pokeTextFieldSx();

const Contact = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
    website: "",
  });

  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<StatusType>("success");
  const [isSending, setIsSending] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTopicSelect = (subject: string) => {
    setFormData((prev) => ({ ...prev, subject }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatusMessage("");
    setIsSending(true);

    try {
      await apiClient.post('/contact', formData);
      setStatusType("success");
      setStatusMessage("Message sent successfully.");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        website: "",
      });
    } catch (error) {
      setStatusType("error");
      const apiMessage = isAxiosError(error) ? error.response?.data : undefined;
      setStatusMessage(
        typeof apiMessage === "string"
          ? apiMessage
          : "Failed to send message. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F6F8FC" }}>
      <Header />

      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          px: { xs: 2, md: 4 },
          pt: { xs: 11, md: 12 },
          pb: 7,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: { xs: 4, md: 5 },
            mb: 4,
            minHeight: { xs: 200, md: 220 },
            border: "1px solid #E5E7EB",
            boxShadow: "0 24px 70px rgba(15, 23, 42, 0.12)",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, #C22E28 0%, #E85D4A 45%, #FFCC00 100%)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: -40,
              right: -20,
              width: 180,
              height: 180,
              borderRadius: "50%",
              bgcolor: "rgba(255,255,255,0.12)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: -60,
              right: 120,
              width: 140,
              height: 140,
              borderRadius: "50%",
              bgcolor: "rgba(42,117,187,0.25)",
            }}
          />

          <Box sx={{ position: "relative", p: { xs: 3, md: 4.5 } }}>
            <Chip
              label="We're here to help"
              sx={{
                mb: 2,
                bgcolor: "rgba(255,255,255,0.2)",
                color: "white",
                fontWeight: 800,
                backdropFilter: "blur(4px)",
              }}
            />
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 900,
                color: "white",
                mb: 1,
                fontSize: { xs: "2rem", md: "2.75rem" },
                textShadow: "0 2px 12px rgba(0,0,0,0.15)",
              }}
            >
              Contact us
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255,255,255,0.92)",
                maxWidth: 560,
                lineHeight: 1.8,
              }}
            >
              Have a question, found a bug, or want to share feedback? Send us a
              message and we'll get back to you soon.
            </Typography>
          </Box>
        </Paper>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "340px 1fr" },
            gap: 4,
            alignItems: "start",
            mb: 4,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: 5,
              bgcolor: "white",
              border: "1px solid #E5E7EB",
              boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
              overflow: "hidden",
              position: { lg: "sticky" },
              top: { lg: 96 },
            }}
          >
            <Box
              sx={{
                height: 120,
                background: "linear-gradient(135deg, #C22E28, #FFCC00)",
              }}
            />

            <Box sx={{ p: 3, mt: -4 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  bgcolor: "white",
                  border: "1px solid #E5E7EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#C22E28",
                  mb: 2,
                  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                }}
              >
                <EmailOutlinedIcon />
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 900, color: "#111827", mb: 1 }}>
                Get in touch
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: "text.secondary", lineHeight: 1.7, mb: 3 }}
              >
                Questions, suggestions, bug reports, or general feedback about PokéWorld.
              </Typography>

              <Stack spacing={2}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: "#F8FAFC",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>
                    Email
                  </Typography>
                  <Link
                    href="mailto:jibingni17@gmail.com"
                    underline="hover"
                    sx={{ fontWeight: 800, color: "#C22E28" }}
                  >
                    jibingni17@gmail.com
                  </Link>
                </Box>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: "#F8FAFC",
                    border: "1px solid #E5E7EB",
                    display: "flex",
                    gap: 1.5,
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: "#EEF2FF",
                      color: "#4F46E5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <AccessTimeOutlinedIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800, color: "#111827", fontSize: "0.9rem" }}>
                      Response time
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Usually within 1–2 business days
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            component="form"
            onSubmit={handleSubmit}
            sx={{
              borderRadius: 5,
              bgcolor: "white",
              border: "1px solid #E5E7EB",
              boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
              p: { xs: 3, md: 4 },
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 900, color: "#111827", mb: 0.75 }}>
              Send a message
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
              Fill out the form below and we'll review your message.
            </Typography>

            <Stack spacing={2.5}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#374151", mb: 1 }}>
                  What's this about?
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {TOPIC_OPTIONS.map((topic) => (
                    <Chip
                      key={topic.subject}
                      icon={topic.icon}
                      label={topic.label}
                      clickable
                      onClick={() => handleTopicSelect(topic.subject)}
                      sx={{
                        fontWeight: 700,
                        bgcolor: formData.subject === topic.subject ? "#FEF2F2" : "#F8FAFC",
                        color: formData.subject === topic.subject ? "#C22E28" : "#374151",
                        border: "1px solid",
                        borderColor:
                          formData.subject === topic.subject ? "#FECACA" : "#E5E7EB",
                        "& .MuiChip-icon": {
                          color: formData.subject === topic.subject ? "#C22E28" : "#6B7280",
                        },
                      }}
                    />
                  ))}
                </Stack>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2.5,
                }}
              >
                <TextField
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  required
                  sx={textFieldSx}
                />
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                  required
                  sx={textFieldSx}
                />
              </Box>

              <TextField
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                fullWidth
                required
                sx={textFieldSx}
              />

              <TextField
                label="Message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                fullWidth
                multiline
                rows={6}
                required
                placeholder="Tell us what's on your mind..."
                sx={textFieldSx}
              />

              <Box
                sx={{
                  position: "absolute",
                  left: "-9999px",
                  opacity: 0,
                  height: 0,
                  overflow: "hidden",
                }}
                aria-hidden="true"
              >
                <TextField
                  label="Website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </Box>

              {statusMessage && (
                <Alert
                  severity={statusType}
                  sx={{ borderRadius: 3, fontWeight: 600 }}
                >
                  {statusMessage}
                </Alert>
              )}

              <Box sx={{ display: "flex", justifyContent: { xs: "stretch", sm: "flex-end" } }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSending}
                  endIcon={
                    isSending ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <SendOutlinedIcon />
                    )
                  }
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    bgcolor: "#C22E28",
                    color: "white",
                    px: 4,
                    py: 1.25,
                    borderRadius: 3,
                    fontWeight: 800,
                    textTransform: "none",
                    boxShadow: "0 8px 24px rgba(194, 46, 40, 0.28)",
                    "&:hover": {
                      bgcolor: "#B22222",
                      boxShadow: "0 10px 28px rgba(194, 46, 40, 0.34)",
                    },
                    "&.Mui-disabled": {
                      bgcolor: "#C22E28",
                      color: "white",
                      opacity: 0.7,
                    },
                  }}
                >
                  {isSending ? "Sending..." : "Send Message"}
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 5,
            border: "1px solid #E5E7EB",
            bgcolor: "white",
            boxShadow: "0 14px 36px rgba(15, 23, 42, 0.06)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 2.5, md: 4 }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: "#FFF1F2",
                    color: "#C22E28",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <InfoOutlinedIcon />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: "#111827" }}>
                    Credits & API attribution
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    PokéWorld uses public APIs for Pokémon, card, and movie data.
                  </Typography>
                </Box>
              </Stack>

              <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.75 }}>
                This product uses TMDB and the TMDB APIs but is not endorsed, certified, or
                otherwise approved by TMDB. PokéWorld also uses{" "}
                <Link href="https://pokeapi.co" target="_blank" rel="noopener noreferrer">
                  PokéAPI
                </Link>{" "}
                and the Pokémon TCG API. PokéWorld is an unofficial fan project and is not
                affiliated with Nintendo, Game Freak, Creatures Inc., or The Pokémon Company.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip
                icon={<MovieOutlinedIcon />}
                label="TMDB"
                sx={{ bgcolor: "#EFF6FF", color: "#1D4ED8", fontWeight: 800 }}
              />
              <Chip
                icon={<CatchingPokemonIcon />}
                label="PokéAPI"
                sx={{ bgcolor: "#FFF7ED", color: "#C2410C", fontWeight: 800 }}
              />
              <Chip
                icon={<CollectionsBookmarkOutlinedIcon />}
                label="Pokémon TCG API"
                sx={{ bgcolor: "#F0FDF4", color: "#15803D", fontWeight: 800 }}
              />
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
};

export default Contact;
