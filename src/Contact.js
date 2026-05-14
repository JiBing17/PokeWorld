import React, { useState } from "react";
import Header from "./Header";
import {
  TextField,
  Button,
  Typography,
  Box,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import CatchingPokemonIcon from '@mui/icons-material/CatchingPokemon';


const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // console.log("Form Submitted:", formData);
    // Add form submission logic here
  };

  return (
    <>
      <Header />

      <Box
        sx={{
          margin: "0 auto 0 auto",
          marginTop: "8rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 6,
          padding: "2rem",
          background: "linear-gradient(to right, #C22E28, #FFCC00 99%)",
        }}
      >
        {/* Left Section - Help Text & Contact Info */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: { xs: "90%", md: "45%" },
            textAlign: "left",
          }}
        >
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: "2.5rem", md: "4rem" },
              fontWeight: "bold",
              marginBottom: "1rem",
              color: "white"
            }}
          >
            Need Help?
          </Typography>

          <Typography sx={{ fontSize: "1.1rem", lineHeight: "1.6", color: "white"}}>
            The help form is designed to provide you with a simple and efficient
            way to reach out to us for assistance. Whether you have questions,
            need support, or want to share feedback, this form is here to make
            the process as smooth as possible. By filling out the form, you
            give us the information we need to better understand your concerns
            and respond in a timely manner. We’re committed to offering the best
            support possible to help you with whatever you need.
          </Typography>

          {/* Contact Information */}
          <Box sx={{ marginTop: "2rem" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <EmailIcon sx={{ color: "white" }} />
              <Typography sx={{ fontSize: "1rem", color: "white" }}>
                jibingni17@gmail.com
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PhoneIcon sx={{ color: "white" }} />
              <Typography sx={{ fontSize: "1rem", color: "white" }}>317-123-1234</Typography>
            </Box>
          </Box>
        </Box>

        {/* Right Section - Form */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            padding: "3rem",
            border: "1px solid #ddd",
            borderRadius: 2,
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
            backgroundColor: "#fff",
            width: { xs: "90%", md: "40%" },
          }}
        >
          <Typography
                variant="h5"
                textAlign="center"
                sx={{
                    fontWeight: "bold",
                    marginBottom: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                }}
            >
                Contact Us
                <CatchingPokemonIcon sx={{ fontSize: "2rem" }} />
            </Typography>

          <TextField
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            variant="outlined"
            fullWidth
            required
          />

          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            variant="outlined"
            fullWidth
            required
          />

          <TextField
            label="Message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            variant="outlined"
            fullWidth
            multiline
            rows={4}
            required
          />

          <Button
            type="submit"
            fullWidth
            sx={{
              backgroundColor: "black",
              color: "white",
              padding: "0.8rem",
              fontSize: "1rem",
              fontWeight: "bold",
              "&:hover": {
                backgroundColor: "black",
                color: "white",
              },
            }}
          >
            Submit
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default Contact;
