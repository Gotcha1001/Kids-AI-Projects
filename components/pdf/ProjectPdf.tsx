// app/components/pdf/ProjectPdf.tsx
// Loaded ONLY via dynamic import from hooks/useDownloadPdf.tsx (react-pdf must not run in SSR).
// Uses built-in Helvetica: no emoji in the PDF, Afrikaans/Zulu accents are fine.
import {
  Document,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { TEMPLATES } from "@/convex/constants";
import { AGE_LABELS, type ProjectSection, type ProjectView } from "@/lib/types";
import { formatDate, splitParagraphs } from "@/lib/projectText";

interface ProjectPdfProps {
  project: ProjectView;
  /** original image url -> data URL (pre-loaded through /api/image-proxy) */
  imageData: Record<string, string>;
}

function makeStyles(accent: string) {
  return StyleSheet.create({
    page: {
      paddingTop: 48,
      paddingBottom: 56,
      paddingHorizontal: 48,
      fontFamily: "Helvetica",
      fontSize: 11,
      lineHeight: 1.5,
      color: "#1f2937",
    },
    coverPage: { padding: 0, fontFamily: "Helvetica" },
    coverBand: {
      backgroundColor: accent,
      padding: 48,
      paddingTop: 90,
      paddingBottom: 60,
    },
    coverTopic: {
      color: "#ffffff",
      fontSize: 12,
      letterSpacing: 2,
      textTransform: "uppercase",
      marginBottom: 12,
    },
    coverTitle: {
      color: "#ffffff",
      fontSize: 36,
      fontFamily: "Helvetica-Bold",
      lineHeight: 1.15,
    },
    coverMeta: { color: "#ffffff", fontSize: 12, marginTop: 18 },
    coverImage: {
      marginHorizontal: 48,
      marginTop: 32,
      height: 280,
      objectFit: "cover",
      borderRadius: 8,
    },
    h2: {
      fontSize: 17,
      fontFamily: "Helvetica-Bold",
      color: accent,
      marginBottom: 6,
    },
    h2Dark: {
      fontSize: 17,
      fontFamily: "Helvetica-Bold",
      color: "#111827",
      marginBottom: 6,
    },
    para: { marginBottom: 6 },
    block: { marginBottom: 18 },
    box: {
      backgroundColor: `${accent}1f`,
      borderRadius: 8,
      padding: 14,
      marginBottom: 18,
    },
    image: {
      width: "100%",
      height: 190,
      objectFit: "cover",
      borderRadius: 6,
      marginVertical: 8,
    },
    caption: {
      fontSize: 8,
      color: "#6b7280",
      fontStyle: "italic",
      marginBottom: 8,
    },
    factRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -4,
      marginBottom: 14,
    },
    fact: { width: "50%", padding: 4 },
    factInner: {
      borderWidth: 1.5,
      borderColor: accent,
      borderStyle: "dashed",
      borderRadius: 8,
      padding: 10,
      fontSize: 10.5,
    },
    numBadgeRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    numBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: accent,
      color: "#ffffff",
      textAlign: "center",
      paddingTop: 4,
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      marginRight: 8,
    },
    storyPage: {
      padding: 48,
      fontFamily: "Helvetica",
      color: "#1f2937",
      borderWidth: 10,
      borderColor: accent,
      borderStyle: "dashed",
    },
    storyKicker: {
      fontSize: 10,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: accent,
      marginBottom: 4,
    },
    storyHeading: {
      fontSize: 26,
      fontFamily: "Helvetica-Bold",
      marginBottom: 14,
    },
    storyImage: {
      width: "100%",
      height: 300,
      objectFit: "cover",
      borderRadius: 10,
      marginBottom: 6,
    },
    storyText: { fontSize: 15, lineHeight: 1.6, marginBottom: 10 },
    tlItem: {
      borderLeftWidth: 3,
      borderLeftColor: accent,
      paddingLeft: 18,
      marginLeft: 8,
      paddingBottom: 14,
      position: "relative",
    },
    tlDot: {
      position: "absolute",
      left: -11,
      top: 0,
      width: 19,
      height: 19,
      borderRadius: 10,
      backgroundColor: accent,
      color: "#ffffff",
      textAlign: "center",
      paddingTop: 3.5,
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
    },
    bibItem: { marginBottom: 5, fontSize: 9.5 },
    bibLink: { color: accent, textDecoration: "underline" },
  });
}

type Styles = ReturnType<typeof makeStyles>;

function Paras({ body, style }: { body: string; style: Styles["para"] }) {
  return (
    <>
      {splitParagraphs(body).map((p, i) => (
        <Text key={i} style={style}>
          {p}
        </Text>
      ))}
    </>
  );
}

function sectionImage(
  project: ProjectView,
  imageData: Record<string, string>,
  section: ProjectSection,
) {
  if (section.imageIndex === undefined) return null;
  const image = project.images[section.imageIndex];
  if (!image) return null;
  const src = imageData[image.url];
  return src ? { src, caption: image.caption } : null;
}

function Footer({ title }: { title: string }) {
  return (
    <Text
      fixed
      style={{
        position: "absolute",
        bottom: 24,
        left: 48,
        right: 48,
        textAlign: "center",
        fontSize: 8,
        color: "#9ca3af",
      }}
      render={({ pageNumber, totalPages }) =>
        `${title} - page ${pageNumber} of ${totalPages}`
      }
    />
  );
}

function Tail({ project, s }: { project: ProjectView; s: Styles }) {
  return (
    <>
      <View style={s.box} wrap={false}>
        <Text style={s.h2}>Summary</Text>
        <Paras body={project.summary} style={s.para} />
      </View>

      {project.glossary.length > 0 && (
        <View style={s.block} wrap={false}>
          <Text style={s.h2}>Word Bank</Text>
          {project.glossary.map((g) => (
            <Text key={g.term} style={s.para}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{g.term}: </Text>
              {g.meaning}
            </Text>
          ))}
        </View>
      )}

      {project.sources.length > 0 && (
        <View style={s.block}>
          <Text style={s.h2}>Bibliography</Text>
          {project.sources.map((src, i) => (
            <Text key={src.url} style={s.bibItem}>
              {i + 1}. {src.title}.{" "}
              <Link src={src.url} style={s.bibLink}>
                {src.url}
              </Link>
              . Retrieved {formatDate(project.createdAt)}.
            </Text>
          ))}
        </View>
      )}
    </>
  );
}

function FunFactsGrid({ project, s }: { project: ProjectView; s: Styles }) {
  if (project.funFacts.length === 0) return null;
  return (
    <View>
      <Text style={s.h2}>Did you know?</Text>
      <View style={s.factRow}>
        {project.funFacts.map((fact, i) => (
          <View key={i} style={s.fact} wrap={false}>
            <Text style={s.factInner}>{fact}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function ProjectPdf({ project, imageData }: ProjectPdfProps) {
  const meta = TEMPLATES[project.template];
  const s = makeStyles(meta.accent);
  const heroImage = project.images
    .map((i) => imageData[i.url])
    .find((src): src is string => Boolean(src));

  return (
    <Document
      title={project.title}
      author={project.studentName ?? "ProjectKids"}
      subject={project.topic}
    >
      {/* Cover (every template) */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverBand}>
          <Text style={s.coverTopic}>{project.topic}</Text>
          <Text style={s.coverTitle}>{project.title}</Text>
          <Text style={s.coverMeta}>
            {project.studentName ? `By ${project.studentName}  |  ` : ""}
            {AGE_LABELS[project.ageGroup].label} |{" "}
            {formatDate(project.createdAt)}
          </Text>
        </View>
        {heroImage && <Image src={heroImage} style={s.coverImage} />}
      </Page>

      {project.template === "storybook" ? (
        <>
          <Page size="A4" style={s.storyPage}>
            <Text style={s.storyKicker}>Once upon a topic</Text>
            <Text style={s.storyHeading}>Introduction</Text>
            <Paras body={project.intro} style={s.storyText} />
            <Footer title={project.title} />
          </Page>
          {project.sections.map((section, i) => {
            const img = sectionImage(project, imageData, section);
            return (
              <Page key={i} size="A4" style={s.storyPage}>
                <Text style={s.storyKicker}>Page {i + 1}</Text>
                <Text style={s.storyHeading}>{section.heading}</Text>
                {img && (
                  <>
                    <Image src={img.src} style={s.storyImage} />
                    <Text style={s.caption}>{img.caption}</Text>
                  </>
                )}
                <Paras body={section.body} style={s.storyText} />
                <Footer title={project.title} />
              </Page>
            );
          })}
          <Page size="A4" style={s.page}>
            <FunFactsGrid project={project} s={s} />
            <Tail project={project} s={s} />
            <Footer title={project.title} />
          </Page>
        </>
      ) : (
        <Page size="A4" style={s.page}>
          <View style={s.box}>
            <Text style={s.h2}>Introduction</Text>
            <Paras body={project.intro} style={s.para} />
          </View>

          {project.template === "factfile" && (
            <FunFactsGrid project={project} s={s} />
          )}

          {project.sections.map((section, i) => {
            const img = sectionImage(project, imageData, section);
            const content = (
              <>
                {img && (
                  <>
                    <Image src={img.src} style={s.image} />
                    <Text style={s.caption}>{img.caption}</Text>
                  </>
                )}
                <Paras body={section.body} style={s.para} />
              </>
            );

            if (project.template === "classic") {
              return (
                <View key={i} style={s.block}>
                  <View style={s.numBadgeRow} minPresenceAhead={80}>
                    <Text style={s.numBadge}>{i + 1}</Text>
                    <Text style={s.h2Dark}>{section.heading}</Text>
                  </View>
                  {content}
                </View>
              );
            }
            if (project.template === "timeline") {
              return (
                <View key={i} style={s.tlItem}>
                  <Text style={s.tlDot}>{i + 1}</Text>
                  <Text style={s.h2Dark} minPresenceAhead={80}>
                    {section.heading}
                  </Text>
                  {content}
                </View>
              );
            }
            // factfile
            return (
              <View key={i} style={s.block}>
                <Text style={s.h2} minPresenceAhead={80}>
                  {section.heading}
                </Text>
                {content}
              </View>
            );
          })}

          {project.template !== "factfile" && (
            <FunFactsGrid project={project} s={s} />
          )}
          <Tail project={project} s={s} />
          <Footer title={project.title} />
        </Page>
      )}
    </Document>
  );
}
