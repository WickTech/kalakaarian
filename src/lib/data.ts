import { Influencer } from "./store";

const cities = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Jaipur", "Ahmedabad", "Lucknow"];
const genres = ["Fashion", "Tech", "Food", "Fitness", "Travel", "Beauty", "Gaming", "Education", "Comedy", "Lifestyle"];
const names = [
  "Arjun Kapoor", "Priya Sharma", "Rohan Mehta", "Sneha Patel", "Vikram Singh",
  "Ananya Desai", "Karan Malhotra", "Divya Nair", "Raj Verma", "Meera Iyer",
  "Aditya Rao", "Pooja Gupta", "Nikhil Joshi", "Shreya Reddy", "Amit Tiwari",
  "Riya Saxena", "Saurabh Pandey", "Neha Kulkarni", "Deepak Chauhan", "Kavita Mishra",
  "Rahul Bhatia", "Tanvi Agarwal", "Manish Kumar", "Simran Kaur", "Varun Dhawan",
  "Ishita Sen", "Gaurav Thakur", "Nisha Yadav", "Akash Jain", "Pallavi Chopra",
  "Suresh Rajan", "Bhavna Shah", "Mohit Bansal", "Tara Menon", "Harsh Vardhan",
  "Lakshmi Pillai", "Vishal Sinha", "Anjali Das", "Prakash Nath", "Sonal Trivedi"
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() + (max - min) * Math.random()) + min;
}

function generateInfluencer(index: number, tier: "nano" | "micro" | "macro" | "celebrity", platform: "instagram" | "youtube"): Influencer {
  const followerRanges = {
    nano: [2000, 30000],
    micro: [31000, 250000],
    macro: [251000, 5000000],
    celebrity: [5000001, 50000000],
  };
  const priceRanges = {
    nano: [1000, 10000],
    micro: [11000, 100000],
    macro: [100000, 1000000],
    celebrity: null,
  };

  const [minF, maxF] = followerRanges[tier];
  const followers = rand(minF, maxF);
  const fakePercent = Math.random() * 0.35;
  const fakeFollowers = Math.floor(followers * fakePercent);
  const activeFollowers = followers - fakeFollowers;
  const male = rand(30, 70);
  const female = rand(20, 100 - male);

  const priceRange = priceRanges[tier];
  const price = priceRange ? rand(priceRange[0], priceRange[1]) : null;

  return {
    id: `${platform}-${tier}-${index}`,
    name: names[index % names.length],
    handle: `@${names[index % names.length].toLowerCase().replace(" ", ".")}`,
    photo: `https://i.pravatar.cc/300?img=${(index % 70) + 1}`,
    platform,
    tier,
    genre: genres[index % genres.length],
    city: cities[index % cities.length],
    followers,
    activeFollowers,
    fakeFollowers,
    avgViews: Math.floor(activeFollowers * (0.02 + Math.random() * 0.15)),
    avgLikes: Math.floor(activeFollowers * (0.01 + Math.random() * 0.08)),
    genderSplit: { male, female, other: 100 - male - female },
    price,
  };
}

const allInfluencers: Influencer[] = [];
const tiers: Array<"nano" | "micro" | "macro" | "celebrity"> = ["nano", "micro", "macro", "celebrity"];
const platforms: Array<"instagram" | "youtube"> = ["instagram", "youtube"];

let idx = 0;
for (const tier of tiers) {
  for (const platform of platforms) {
    const count = tier === "celebrity" ? 5 : 15;
    for (let i = 0; i < count; i++) {
      allInfluencers.push(generateInfluencer(idx, tier, platform));
      idx++;
    }
  }
}

export { allInfluencers };
