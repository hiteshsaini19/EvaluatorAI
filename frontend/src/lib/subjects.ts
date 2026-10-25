export interface Subject {
  id: number;
  slug: string;
  name: string;
  group_name: string;
  scope: string;
  easy_rubric: string;
  medium_rubric: string;
  hard_rubric: string;
  sort_order: number;
  question_count: number;
}

// Groups subjects by group_name, keeping the catalogue order the API returns
export const groupSubjects = (subjects: Subject[]): { group: string; subjects: Subject[] }[] => {
  const groups: { group: string; subjects: Subject[] }[] = [];
  for (const subject of subjects) {
    let entry = groups.find(g => g.group === subject.group_name);
    if (!entry) {
      entry = { group: subject.group_name, subjects: [] };
      groups.push(entry);
    }
    entry.subjects.push(subject);
  }
  return groups;
};
