import { notFound } from "next/navigation";
import { EXAMS, getExam, getQuestions, getDomains } from "@/lib/exams";
import type { ExamId } from "@/lib/types";
import ExamRunner from "@/components/ExamRunner";

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
  return { title: exam ? `${exam.code} — ${exam.name}` : "Exam" };
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

  return <ExamRunner exam={exam} questions={questions} domains={domains} />;
}
