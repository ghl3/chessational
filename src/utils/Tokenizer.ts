export interface Token {
  token: string;
  type: "move";
}

export interface PartialToken {
  token: string;
  type: "partial";
}

const movePattern =
  /^([NBRQK])?([a-h])?([1-8])?x?([a-h][1-8])(=[NBRQK])?[+#]?$/;

const parseToToken = (tokenString: string): Token | PartialToken => {
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

export const tokenizeQuery = (query: string): (Token | PartialToken)[] => {
  return (
    query
      //.toLowerCase()
      .split(/\s+/)
      .filter((token) => token.length > 0)
      .map(parseToToken)
  );
};
