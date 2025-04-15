const PLACEHOLDER_REGEX = /\[\[(.*?)\]\]/g;

export const Template = {
  build: ({ template, data }) => {
    try {
      if (!data || typeof data !== "object") {
        return template;
      }

      return template.replace(PLACEHOLDER_REGEX, (match, variablePath) => {
        const cleanPath = variablePath.trim().split(".");
        const value = cleanPath.reduce((cur, key) => cur?.[key], data);

        if (value === undefined) {
          return match;
        }

        if (typeof value === "object" && value !== null) {
          try {
            return JSON.stringify(value);
          } catch (error) {
            console.error("Erro ao serializar objeto:", error);
            return match;
          }
        } else {
          return String(value);
        }
      });
    } catch (error) {
      console.log("ERROR", error);
      throw error;
    }
  },
};
