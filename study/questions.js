/**
 * Copy and options from the Phase 2 Google Form
 * https://docs.google.com/forms/d/e/1FAIpQLSeXeWUYzFARmml6SxdrWYBA78pfs4-ltLulygOXVXgUJoUO_g/viewform
 */
window.STUDY = {
  researcherEmail: "maja.skale@student.um.si",
  urls: {
    A: "https://majakle.github.io/sign-up/?signup=yes",
    B: "https://majakle.github.io/registration-study/register/",
  },
  hints: {
    A: "Complete the registration process using the fictional information provided.",
    B: "Complete the registration process using the fictional information provided.",
  },
  testData: [
    ["Company name", "Company"],
    ["Email address", "name@example.com"],
    ["First name", "Test"],
    ["Last name", "Test"],
    ["VAT number", "NL123456789B01"],
    ["Phone number", "+31 6 12345678"],
    ["Street", "Example Street"],
    ["House number", "25"],
    ["Postal code", "2031 AB"],
    ["City", "Haarlem"],
    ["Country", "Netherlands"],
    ["Website", "https://example.com"],
    ["Social media", "https://www.linkedin.com/company/example"],
  ],
  susScale: [
    "Strongly disagree",
    "Disagree",
    "Neither agree nor disagree",
    "Agree",
    "Strongly agree",
  ],
  susItems: [
    {
      id: "s1",
      text: "I think that I would like to use this way of registration frequently",
    },
    {
      id: "s2",
      text: "I found the registration process unnecessarily complex.",
    },
    {
      id: "s3",
      text: "I thought the registration process was easy to use.",
    },
    {
      id: "s4",
      text: "I think I would need support from a technically experienced person to complete the registration.",
    },
    {
      id: "s5",
      text: "I found that the different parts of the registration process were well integrated.",
    },
    {
      id: "s6",
      text: "I thought there was too much inconsistency in the registration process.",
    },
    {
      id: "s7",
      text: "I imagine that most people would learn to use this registration process very quickly.",
    },
    {
      id: "s8",
      text: "I found the registration process very cumbersome to use.",
    },
    {
      id: "s9",
      text: "I felt confident while completing the registration process.",
    },
    {
      id: "s10",
      text: "I needed to learn many things before I could complete the registration process.",
    },
  ],
  roles: [
    "Business owner or company director",
    "Sales employee",
    "Purchasing or procurement employee",
    "Interior designer or architect",
    "Administrative employee",
    "Information technology employee",
    "Student",
    "Other",
  ],
  b2bExperience: [
    "No previous experience",
    "Limited experience",
    "Some experience",
    "Considerable experience",
    "Extensive experience",
  ],
  priorRegistration: ["Yes", "No", "I am not sure"],
  ages: [
    "Under 18",
    "18-24",
    "25-34",
    "35-44",
    "45-54",
    "55-64",
    "65 or older",
    "Prefer not to answer",
  ],
};
