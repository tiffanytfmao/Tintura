import { createBrowserRouter } from "react-router";
import Root from "./Root";
import Diary from "./pages/Diary";
import Roll from "./pages/Roll";
import Entry from "./pages/Entry";
import Curation from "./pages/Curation";
import Capture from "./pages/Capture";
import Blend from "./pages/Blend";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      Component: Root,
      children: [
        { index: true, Component: Diary },
        { path: "roll", Component: Roll },
        { path: "entry/:id", Component: Entry },
        { path: "curation/:id", Component: Curation },
        { path: "capture", Component: Capture },
        { path: "blend", Component: Blend },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL }
);
