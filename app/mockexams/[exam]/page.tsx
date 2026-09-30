import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { EXAMS, examStats, getExam, getQuestions, getDomains } from "@/lib/exams";
import {
  breadcrumbs,
  examQuiz,
  graph,
  organization,
  pageMetadata,
  webPage,
  website,
} from "@/lib/seo";
import type { ExamId } from "@/lib/types";
import ExamRunner from "@/components/ExamRunner";
import ExamOverview from "@/components/ExamOverview";

export function generateStaticParams() {
  return EXAMS.map((e) => ({ exam: e.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ exam: string }>;
}) {
  const { exam: id } = await params;
  const exam = getExam(id);
  if (!exam) return { title: "Exam" };
  const stats = examStats(exam.id as ExamId);
  return pageMetadata({
    path: `/mockexams/${exam.id}`,
    title: `${exam.code} — ${exam.name}`,
    ogTitle: `${exam.code} practice questions and mock exam`,
    description: `${stats.total.toLocaleString()} free practice questions for ${exam.name} (${exam.code}), with instant explanations and a full ${exam.mockCount}-question timed mock exam. No account needed.`,
  });
}

export default async function ExamPage({
  params,
}: {
  params: Promise<{ exam: string }>;
}) {
  const { exam: id } = await params;
  const exam = getExam(id);
  if (!exam) notFound();

  const questions = getQuestions(exam.id as ExamId);
  const domains = getDomains(exam.id as ExamId);

  return (
    <>
      <JsonLd
        data={graph(
          organization(),
          website(),
          webPage({
            path: `/mockexams/${exam.id}`,
            name: `${exam.code} practice questions and mock exam`,
            description: `Free practice questions and a timed mock exam for ${exam.name}.`,
          }),
          breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Mock Exams", path: "/mockexams" },
            { name: exam.code, path: `/mockexams/${exam.id}` },
          ]),
          examQuiz(exam, domains.map((d) => d.name)),
        )}
      />
      <ExamRunner exam={exam} questions={questions} domains={domains} />
      <ExamOverview exam={exam} domains={domains} />
    </>
  );
}
