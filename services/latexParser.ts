const COMMAND_MAP: Record<string, string> = {
  '\\t': 't',
  '\\d': 'd',
  '\\n': 'n',
  '\\m': 'm',
  '\\p': 'p',
  '\\b': 'b',
  '\\f': 'f',
  '\\v': 'v',
  '\\r': 'r',
  '\\l': 'l',
  '\\e': 'e',
  '\\a': 'a',
  '\\s': 's',
  '\\space': ' '
};

export const parseLatexPrimitives = (input: string): string[] => {
  const cleaned = input.replace(/[\r\n]/g, ' ').trim();
  if (!cleaned) return [];

  return cleaned
    .split(/\s+/)
    .map((raw) => raw.replace(/[,;]+$/, '').toLowerCase())
    .map((token) => COMMAND_MAP[token])
    .filter((token): token is string => Boolean(token));
};
