require("dotenv").config();

exports.getStories = async (req, res) => {
  const stories = [
    {
      id: 1,
      title: "Bay Area Immigration Surge",
      abstract: "Federal agents will start arriving in the Bay Area.",
      url: "https://sfstandard.com/2025/10/22/customs-border-protection-alameda-coast-guard/",
    },
    {
      id: 2,
      title: "Government Shutdown",
      abstract:
        "Federal workers hunker down as they go without pay in shutdown: Protect every penny.",
      url: "https://www.cbsnews.com/news/government-shutdown-federal-workers-missing-paycheck-2025/",
    },
    {
      id: 3,
      title: "SF mayor says federal deployment called off",
      abstract:
        "Mayor Lurie says Trump's pullback of federal agents is a San Francisco victory.",
      url: "https://abc7news.com/post/san-francisco-mayor-daniel-lurie-says-president-trump-has-called-off-federal-deployment-city/18062281/",
    },
    {
      id: 4,
      title: "Climate Efforts Intensify in 2025",
      abstract:
        "Governments agree to new carbon reduction goals in global summit.",
      url: "https://www.nytimes.com/",
    },
  ];

  try {
    const results = await Promise.all(
      stories.map(async (story) => {
        const response = await fetch(
          "https://api.heygen.com/v2/video/generate",
          {
            method: "POST",
            headers: {
              "X-Api-Key": process.env.HEYGEN_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              video_inputs: [
                {
                  character: {
                    type: "avatar",
                    avatar_id: "Albert_public_1",
                    avatar_style: "normal",
                  },
                  voice: {
                    type: "text",
                    input_text: story.abstract,
                    voice_id: "f38a635bee7a4d1f9b0a654a31d050d2",
                  },
                  background: {
                    type: "color",
                    value: "#FAFAFA",
                  },
                },
              ],
              dimension: {
                width: 1280,
                height: 720,
              },
            }),
          }
        );

        const data = await response.json();
        return {
          ...story,
          heygen_response: data,
        };
      })
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate videos" });
  }
};
