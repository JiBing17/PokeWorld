import { Box, Container, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PageShell from './layout/PageShell';

export default function Privacy() {
  return (
    <PageShell>
      <Container maxWidth="md" sx={{ py: { xs: 12, md: 14 } }}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: '#111827', mb: 2 }}>
          Privacy Policy
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
          Last updated: June 2026
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="body1" sx={{ color: '#374151', lineHeight: 1.75 }}>
            PokéWorld is an unofficial fan website. This policy explains what information we collect
            and how it is used.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
            Information we collect
          </Typography>
          <Typography variant="body1" sx={{ color: '#374151', lineHeight: 1.75 }}>
            If you create an account, we store your username and a hashed password, or your Google
            account email when you sign in with Google. We also store your saved favorite Pokémon.
            If you use the contact form, we receive the name, email, subject, and message you
            submit.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
            How we use information
          </Typography>
          <Typography variant="body1" sx={{ color: '#374151', lineHeight: 1.75 }}>
            Account information is used to authenticate you and persist your favorites. Contact form
            submissions are used only to respond to your message. Chatbot conversations are not
            stored on our servers after a request is completed.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
            Third-party services
          </Typography>
          <Typography variant="body1" sx={{ color: '#374151', lineHeight: 1.75 }}>
            PokéWorld uses PokéAPI, the Pokémon TCG API, TMDB, Google Sign-In, Google Gemini, and
            MongoDB Atlas. Those services have their own privacy policies and terms.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
            Cookies and local storage
          </Typography>
          <Typography variant="body1" sx={{ color: '#374151', lineHeight: 1.75 }}>
            We store your login token and username in your browser&apos;s local storage so you stay
            signed in. We may also cache API responses in session storage to improve performance.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
            Contact
          </Typography>
          <Typography variant="body1" sx={{ color: '#374151', lineHeight: 1.75 }}>
            Questions about this policy can be sent through the{' '}
            <Link component={RouterLink} to="/contact">
              Contact page
            </Link>
            .
          </Typography>
        </Box>
      </Container>
      <Box sx={{ pb: 10 }} />
    </PageShell>
  );
}
