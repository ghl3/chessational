export interface Token {
  token: string;
  type: "move" | "partial";
}

const movePattern =
  /^([NBRQK])?([a-h])?([1-8])?x?([a-h][1-8])(=[NBRQK])?[+#]?$/;

const parseToToken = (tokenString: string): Token => {
  console.log("tokenString: ", tokenString);
  if (
    movePattern.test(tokenString) ||
    tokenString === "O-O" ||
    tokenString === "O-O-O"
  ) {
    return { token: tokenString, type: "move" };
  } else {
    return { token: tokenString, type: "partial" };
  }
};

export const tokenizeQuery = (query: string): Token[] => {
  return (
    query
      //.toLowerCase()
      .split(/\s+/)
      .filter((token) => token.length > 0)
      .map(parseToToken)
  );
};
