import BookNow from "./pages/BookNow";
import ContactUs from "./pages/ContactUs";
import GetQuote from "./pages/GetQuote";
import Home from "./pages/Home";
import ThankYou from "./pages/ThankYou";

const routes: Record<string, JSX.Element> = {
  "/": <Home />,
  "/book-now": <BookNow />,
  "/get-quote": <GetQuote />,
  "/contact-us": <ContactUs />,
  "/thank-you": <ThankYou />,
};

export default function App() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";

  return routes[pathname] ?? <Home />;
}
