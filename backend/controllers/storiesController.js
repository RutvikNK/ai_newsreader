exports.getStories = (req, res) => {
  const stories = [
    {
      id: 1,
      title: "Bay Area Immigration Surge",
      abstract: "Federal agents will start arriving in the Bay Area.",
      gcs_video_url:
        "https://app.heygen.com/embedded-player/a99a2063640943618bd193e8eb5cb266",
      // "https://app.heygen.com/videos/833aee2e90924d22a29cc0907d5d76f4",
      url: "https://sfstandard.com/2025/10/22/customs-border-protection-alameda-coast-guard/",
    },
    {
      id: 2,
      title: "SF mayor says federal deployment called off",
      abstract:
        "Mayor Lurie says Trump's pullback of federal agents is a San Francisco victory.",
      gcs_video_url:
        "https://app.heygen.com/embedded-player/dea35a42ff7f4220afdfdd53f5967239",
      url: "https://abc7news.com/post/san-francisco-mayor-daniel-lurie-says-president-trump-has-called-off-federal-deployment-city/18062281/",
    },
    {
      id: 3,
      title: "Amazon global internet outage",
      abstract:
        "Amazon says systems are back online after global internet outage.",
      gcs_video_url:
        "https://app.heygen.com/embedded-player/2c13fa900bcf48199245f78f237918bc",
      url: "https://www.cnn.com/business/live-news/amazon-tech-outage-10-20-25-intl",
    },
    {
      id: 4,
      title: "US Government Shutdown Update",
      abstract:
        "Government shutdown nears end as House panel advances Senate-passed funding bill.",
      gcs_video_url:
        "https://app.heygen.com/embedded-player/73d29cf6d6ce43fa8b18c6e4188361de",
      url: "https://www.cbsnews.com/live-updates/government-shutdown-latest-house-senate-vote/",
    },

    {
      id: 5,
      title: "Government Shutdown",
      abstract:
        "Federal workers hunker down as they go without pay in shutdown: Protect every penny.",
      gcs_video_url:
        "https://app.heygen.com/embedded-player/66dcd67d49d442b3a757a0d95383e763",
      url: "https://www.cbsnews.com/news/government-shutdown-federal-workers-missing-paycheck-2025/",
    },
  ];
  res.json(stories);
};
