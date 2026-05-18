import React, { useState } from "react";
import axios from "axios";
import Header from "./Header";
import {
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Stack,
  Divider,
  Chip,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import MovieOutlinedIcon from "@mui/icons-material/MovieOutlined";
import CatchingPokemonIcon from "@mui/icons-material/CatchingPokemon";
import CollectionsBookmarkOutlinedIcon from "@mui/icons-material/CollectionsBookmarkOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [statusMessage, setStatusMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage("");
    setIsSending(true);

    try {
      await axios.post("http://localhost:5000/api/contact", formData);

      setStatusMessage("Message sent successfully.");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      setStatusMessage(
        error.response?.data || "Failed to send message. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F6F8FC",
      }}
    >
      <Header />

      <Box
        sx={{
          maxWidth: 1120,
          mx: "auto",
          px: { xs: 2, md: 4 },
          pt: { xs: 12, md: 13 },
          pb: 7,
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 900,
              color: "#111827",
              mb: 1,
              fontSize: { xs: "2.2rem", md: "3rem" },
            }}
          >
            Contact us
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              maxWidth: 680,
              lineHeight: 1.8,
            }}
          >
            Have a question, found a bug, or want to share feedback? Send us a
            message and we’ll get back to you as soon as possible.
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            mb: 4,
            p: { xs: 2.5, md: 3 },
            borderRadius: 4,
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
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 900,
                      color: "#111827",
                      lineHeight: 1.2,
                    }}
                  >
                    Credits & API attribution
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    PokéWorld uses public APIs for Pokémon, card, and movie data.
                  </Typography>
                </Box>
              </Stack>

              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  lineHeight: 1.75,
                  maxWidth: 760,
                }}
              >
                This product uses the TMDB API but is not endorsed or certified by
                TMDB. PokéWorld also uses PokéAPI and the Pokémon TCG API for Pokémon
                and trading card information.
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  lineHeight: 1.75,
                  maxWidth: 760,
                  mt: 1,
                }}
              >
                PokéWorld is an unofficial fan project and is not affiliated with,
                endorsed, or sponsored by Nintendo, Game Freak, Creatures Inc., or The
                Pokémon Company.
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              sx={{
                justifyContent: { xs: "flex-start", md: "flex-end" },
                maxWidth: { xs: "100%", md: 310 },
              }}
            >
              <Chip
                icon={<MovieOutlinedIcon />}
                label="TMDB"
                sx={{
                  bgcolor: "#EFF6FF",
                  color: "#1D4ED8",
                  fontWeight: 800,
                }}
              />

              <Chip
                icon={<CatchingPokemonIcon />}
                label="PokéAPI"
                sx={{
                  bgcolor: "#FFF7ED",
                  color: "#C2410C",
                  fontWeight: 800,
                }}
              />

              <Chip
                icon={<CollectionsBookmarkOutlinedIcon />}
                label="Pokémon TCG API"
                sx={{
                  bgcolor: "#F0FDF4",
                  color: "#15803D",
                  fontWeight: 800,
                }}
              />
            </Stack>
          </Stack>
        </Paper>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            bgcolor: "white",
            border: "1px solid #E5E7EB",
            boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "360px 1fr" },
            }}
          >
            <Box
              sx={{
                p: { xs: 3, md: 4 },
                bgcolor: "#FAFBFC",
                borderRight: { xs: "none", md: "1px solid #E5E7EB" },
                borderBottom: { xs: "1px solid #E5E7EB", md: "none" },
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  color: "#111827",
                  mb: 1,
                }}
              >
                Get in touch
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  lineHeight: 1.7,
                  mb: 3,
                }}
              >
                We’re happy to help with questions, suggestions, bug reports,
                or general feedback about PokéWorld.
              </Typography>

              <Stack spacing={2.5}>
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      bgcolor: "#FEF2F2",
                      color: "#C22E28",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <EmailOutlinedIcon />
                  </Box>

                  <Box>
                    <Typography sx={{ fontWeight: 800, color: "#111827" }}>
                      Email
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      jibingni17@gmail.com
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      bgcolor: "#FFF7ED",
                      color: "#EA580C",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <PhoneOutlinedIcon />
                  </Box>

                  <Box>
                    <Typography sx={{ fontWeight: 800, color: "#111827" }}>
                      Phone
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      317-123-1234
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      bgcolor: "#EEF2FF",
                      color: "#4F46E5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <AccessTimeOutlinedIcon />
                  </Box>

                  <Box>
                    <Typography sx={{ fontWeight: 800, color: "#111827" }}>
                      Response time
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Usually within 1–2 business days
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                p: { xs: 3, md: 4 },
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  color: "#111827",
                  mb: 0.75,
                }}
              >
                Send a message
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  mb: 3,
                }}
              >
                Fill out the form below and we’ll review your message.
              </Typography>

              <Stack spacing={2.5}>
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
                  />

                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Box>

                <TextField
                  label="Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  fullWidth
                  required
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
                />

                {statusMessage && (
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        statusMessage === "Message sent successfully."
                          ? "#15803D"
                          : "#C22E28",
                      fontWeight: 700,
                    }}
                  >
                    {statusMessage}
                  </Typography>
                )}

                <Divider />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: { xs: "stretch", sm: "flex-end" },
                  }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSending}
                    endIcon={<SendOutlinedIcon />}
                    sx={{
                      width: { xs: "100%", sm: "auto" },
                      bgcolor: "#C22E28",
                      color: "white",
                      px: 4,
                      py: 1.25,
                      borderRadius: 2,
                      fontWeight: 800,
                      textTransform: "none",
                      boxShadow: "none",
                      "&:hover": {
                        bgcolor: "#B22222",
                        boxShadow: "none",
                      },
                    }}
                  >
                    {isSending ? "Sending..." : "Send Message"}
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Contact;