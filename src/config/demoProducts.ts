type Category = 'Club Jerseys' | 'National Team Jerseys' | 'Retro Jerseys' | 'Training Wear' | 'Accessories'

const now = '2026-08-01T00:00:00.000Z'
const data: Array<[string, string, string, Category, string, number, string, boolean, number]> = [
  ['real-madrid-home-2025-26', 'Real Madrid Home Jersey 2025/26', 'Real Madrid', 'Club Jerseys', '2025/26', 320, '/images/madrid.jpg', true, 14],
  ['barcelona-home-2025-26', 'FC Barcelona Home Jersey 2025/26', 'FC Barcelona', 'Club Jerseys', '2025/26', 320, '/images/barca_home.jpg', true, 11],
  ['manchester-united-home-2025-26', 'Manchester United Home Jersey 2025/26', 'Manchester United', 'Club Jerseys', '2025/26', 310, '/images/manchester_united_red.jpg', true, 8],
  ['arsenal-home-2025-26', 'Arsenal Home Jersey 2025/26', 'Arsenal', 'Club Jerseys', '2025/26', 310, '/images/arsenal.jpg', true, 10],
  ['ghana-black-stars-home', 'Ghana Black Stars Home Jersey', 'Ghana', 'National Team Jerseys', '2025/26', 290, '/images/ghana_white.jpg', true, 18],
  ['argentina-home', 'Argentina Home Jersey', 'Argentina', 'National Team Jerseys', '2025/26', 290, '/images/argentina_home.jpg', true, 10],
  ['brazil-home', 'Brazil Home Jersey', 'Brazil', 'National Team Jerseys', '2025/26', 290, '/images/brazil_yellow.jpg', true, 10],
  ['france-home', 'France Home Jersey', 'France', 'National Team Jerseys', '2025/26', 290, '/images/france.jpg', false, 10],
  ['germany-home', 'Germany Home Jersey', 'Germany', 'National Team Jerseys', '2025/26', 290, '/images/germany.jpg', false, 10],
  ['italy-home', 'Italy Home Jersey', 'Italy', 'National Team Jerseys', '2025/26', 290, '/images/italy.jpg', false, 10],
  ['portugal-home', 'Portugal Home Jersey', 'Portugal', 'National Team Jerseys', '2025/26', 290, '/images/portugal.jpg', false, 10],
  ['spain-home', 'Spain Home Jersey', 'Spain', 'National Team Jerseys', '2025/26', 290, '/images/spain_red.jpg', false, 10],
  ['usa-home', 'USA Home Jersey', 'USA', 'National Team Jerseys', '2025/26', 290, '/images/usa_white.jpg', false, 10],
  ['chelsea-home-2025-26', 'Chelsea Home Jersey 2025/26', 'Chelsea', 'Club Jerseys', '2025/26', 310, '/images/chelsea_blue.jpg', false, 7],
  ['liverpool-home-2025-26', 'Liverpool Home Jersey 2025/26', 'Liverpool', 'Club Jerseys', '2025/26', 310, '/images/liverpool.jpg', false, 9],
  ['nigeria-super-eagles-home', 'Nigeria Super Eagles Home Jersey', 'Nigeria', 'National Team Jerseys', '2025/26', 290, '/images/nigeria.jpg', false, 12],
  ['ac-milan-retro-1995', 'AC Milan Retro Jersey', 'AC Milan', 'Retro Jerseys', '1995/96', 350, '/images/ac_milan_retro.jpeg', false, 5],
  ['inter-milan-home-2025-26', 'Inter Milan Home Jersey 2025/26', 'Inter Milan', 'Club Jerseys', '2025/26', 315, '/images/inter_milan.jpg', false, 6],
  ['fatco-training-top-black', 'Fatco GH Training Top', 'Fatco GH', 'Training Wear', 'Core Collection', 180, '/images/training_top.jpg', true, 15],
  ['football-training-shorts', 'Football Training Shorts', 'Fatco GH', 'Training Wear', 'Core Collection', 120, '/images/training_shorts.jpg', false, 18],
  ['football-tracksuit-set', 'Football Tracksuit Set', 'Fatco GH', 'Training Wear', 'Core Collection', 360, '/images/tracksuit.jpg', false, 8],
  ['performance-football-socks', 'Performance Football Socks', 'Fatco GH', 'Accessories', 'Core Collection', 55, '/images/accessory-socks.svg', false, 25],
  ['matchday-kit-bag', 'Matchday Kit Bag', 'Fatco GH', 'Accessories', 'Core Collection', 160, '/images/kit_bag.jpg', false, 10],
  ['fatco-supporter-cap', 'Fatco GH Supporter Cap', 'Fatco GH', 'Accessories', 'Core Collection', 95, '/images/supporter_cap.jpg', false, 14],
  ['fatco-fugu-shirt', 'Fatco Fugu Shirt', 'Fatco GH', 'Accessories', 'Core Collection', 220, '/images/accessories_fugu.jpg', false, 10],
  ['fatco-zalaabia', 'Fatco Zalaabia', 'Fatco GH', 'Accessories', 'Core Collection', 280, '/images/accessories_zalaabia.jpg', false, 10],
  ['fatco-football-shoes', 'Football Shoes', 'Fatco GH', 'Accessories', 'Core Collection', 260, '/images/accessories_shoes.jpg', false, 10],
  ['fatco-sport-watch', 'Fatco Sport Watch', 'Fatco GH', 'Accessories', 'Core Collection', 150, '/images/accessories_watch.jpg', false, 10],
]

const additionalImages: Record<string, string[]> = {
  'ghana-black-stars-home': ['/images/ghana.jpg'],
  'argentina-home': ['/images/argentina.jpg'],
  'brazil-home': ['/images/brazil.jpg'],
  'spain-home': ['/images/spain.jpg'],
  'usa-home': ['/images/usa.jpg'],
  'arsenal-home-2025-26': ['/images/arsenal.jpg'],
  'manchester-united-home-2025-26': ['/images/manchester_united.jpg'],
  'ac-milan-retro-1995': ['/images/ac_milan.jpg'],
}

export const demoProducts = data.map(([slug, name, team, category, season, price, image_url, is_featured, stock_quantity], index) => ({
  id: `demo-${index + 1}`, slug, name, team, category, season, price, image_url, is_featured, stock_quantity,
  currency: 'GHS', additional_images: additionalImages[slug] ?? [], sizes: category === 'Accessories' ? ['One Size'] : ['S', 'M', 'L', 'XL'], is_available: stock_quantity > 0,
  description: `A demo ${team} jersey listing for the Fatco GH catalogue. Replace this description with your actual stock details.`, created_at: now, updated_at: now,
}))
