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

        return value !== undefined ? String(value) : match;
      });
    } catch (error) {
      console.log("ERROR", error);
      throw error;
    }
  },
};
