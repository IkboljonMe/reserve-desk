import React from 'react'
import {
  Waves, Dumbbell, Sparkles, HandHeart, Utensils, UtensilsCrossed, Coffee, Wine,
  Martini, Beer, CupSoda, Pizza, Croissant, IceCreamCone, Cake, Soup, Fish, Salad,
  Bath, ShowerHead, Droplets, Flame, Thermometer, Bike, Car, CarFront, CircleParking,
  Plane, PlaneTakeoff, Bus, TramFront, Train, Ship, Sailboat, Anchor, MapPin, Users,
  User, Presentation, Projector, Calendar, CalendarDays, Clock, Bed, BedDouble,
  DoorOpen, Key, KeyRound, Luggage, Briefcase, ShoppingBag, ShoppingCart, Gift, Music,
  Mic, Radio, Tv, Film, Clapperboard, Gamepad2, Dices, Trophy, Medal, Target,
  Volleyball, Tent, TreePine, TreePalm, Flower, Flower2, Leaf, Sun, Moon, Cloud,
  Umbrella, Snowflake, Wind, Mountain, MountainSnow, Footprints, PersonStanding, Baby,
  Dog, Cat, PawPrint, Bird, Heart, HeartPulse, Stethoscope, Pill, Syringe, Cross,
  Shield, ShieldCheck, Wifi, Bluetooth, BatteryCharging, PlugZap, Zap, Lightbulb,
  Wrench, Hammer, Scissors, Shirt, WashingMachine, Sofa, Armchair, Lamp, Toilet,
  CookingPot, Refrigerator, Microwave, Camera, Image, Book, BookOpen, Bookmark,
  Newspaper, Palette, Brush, Star, Crown, Gem, Flag, Bell, BellRing, Phone, Mail,
  MessageCircle, Globe, Compass, Map as MapIcon, Navigation, Rocket, Settings, Home, Building,
  Building2, Hotel, Store, Warehouse, Landmark, School, Fuel, Accessibility, Cigarette,
  type LucideIcon,
} from 'lucide-react'

export interface IconEntry {
  name: string        // stable key stored on the Service (lucide export name)
  keywords: string    // space-separated search terms
  Icon: LucideIcon
}

// Curated, searchable icon set for hotel services and general use.
export const iconRegistry: IconEntry[] = [
  { name: 'Waves', keywords: 'pool swim aqua water sea', Icon: Waves },
  { name: 'Dumbbell', keywords: 'gym fitness sport exercise workout training', Icon: Dumbbell },
  { name: 'Sparkles', keywords: 'spa clean shine sparkle wellness', Icon: Sparkles },
  { name: 'HandHeart', keywords: 'massage therapy care wellness relax', Icon: HandHeart },
  { name: 'Utensils', keywords: 'restaurant dining food meal eat', Icon: Utensils },
  { name: 'UtensilsCrossed', keywords: 'restaurant dining food kitchen', Icon: UtensilsCrossed },
  { name: 'Coffee', keywords: 'coffee cafe drink breakfast tea', Icon: Coffee },
  { name: 'Wine', keywords: 'wine bar drink alcohol', Icon: Wine },
  { name: 'Martini', keywords: 'cocktail bar drink lounge', Icon: Martini },
  { name: 'Beer', keywords: 'beer bar pub drink', Icon: Beer },
  { name: 'CupSoda', keywords: 'soda drink soft juice', Icon: CupSoda },
  { name: 'Pizza', keywords: 'pizza food dining fast', Icon: Pizza },
  { name: 'Croissant', keywords: 'bakery breakfast pastry food', Icon: Croissant },
  { name: 'IceCreamCone', keywords: 'ice cream dessert cold sweet', Icon: IceCreamCone },
  { name: 'Cake', keywords: 'cake dessert party birthday', Icon: Cake },
  { name: 'Soup', keywords: 'soup food dining hot', Icon: Soup },
  { name: 'Fish', keywords: 'fish seafood food dining', Icon: Fish },
  { name: 'Salad', keywords: 'salad food healthy vegetarian', Icon: Salad },
  { name: 'Bath', keywords: 'bath spa relax bathroom', Icon: Bath },
  { name: 'ShowerHead', keywords: 'shower bathroom water clean', Icon: ShowerHead },
  { name: 'Droplets', keywords: 'water clean drops laundry', Icon: Droplets },
  { name: 'Flame', keywords: 'sauna steam hot fire heat', Icon: Flame },
  { name: 'Thermometer', keywords: 'temperature sauna heat hot', Icon: Thermometer },
  { name: 'Bike', keywords: 'bike bicycle cycling rent sport', Icon: Bike },
  { name: 'Car', keywords: 'car parking transport garage', Icon: Car },
  { name: 'CarFront', keywords: 'car valet parking transport', Icon: CarFront },
  { name: 'CircleParking', keywords: 'parking garage valet car', Icon: CircleParking },
  { name: 'Plane', keywords: 'airport plane travel transfer', Icon: Plane },
  { name: 'PlaneTakeoff', keywords: 'airport shuttle plane transfer', Icon: PlaneTakeoff },
  { name: 'Bus', keywords: 'bus shuttle transport transfer', Icon: Bus },
  { name: 'TramFront', keywords: 'tram transport city transfer', Icon: TramFront },
  { name: 'Train', keywords: 'train transport travel station', Icon: Train },
  { name: 'Ship', keywords: 'ship boat cruise sea', Icon: Ship },
  { name: 'Sailboat', keywords: 'sailboat boat sea marina', Icon: Sailboat },
  { name: 'Anchor', keywords: 'anchor marina boat sea', Icon: Anchor },
  { name: 'MapPin', keywords: 'location place map pin', Icon: MapPin },
  { name: 'Users', keywords: 'group people conference meeting', Icon: Users },
  { name: 'User', keywords: 'person guest user profile', Icon: User },
  { name: 'Presentation', keywords: 'conference meeting hall event presentation', Icon: Presentation },
  { name: 'Projector', keywords: 'projector meeting conference cinema', Icon: Projector },
  { name: 'Calendar', keywords: 'calendar booking schedule date', Icon: Calendar },
  { name: 'CalendarDays', keywords: 'calendar booking schedule event', Icon: CalendarDays },
  { name: 'Clock', keywords: 'clock time hours schedule', Icon: Clock },
  { name: 'Bed', keywords: 'bed room sleep stay', Icon: Bed },
  { name: 'BedDouble', keywords: 'bed double room suite stay', Icon: BedDouble },
  { name: 'DoorOpen', keywords: 'room door entry access', Icon: DoorOpen },
  { name: 'Key', keywords: 'key room access checkin', Icon: Key },
  { name: 'KeyRound', keywords: 'key access security room', Icon: KeyRound },
  { name: 'Luggage', keywords: 'luggage bag baggage porter travel', Icon: Luggage },
  { name: 'Briefcase', keywords: 'business work office briefcase', Icon: Briefcase },
  { name: 'ShoppingBag', keywords: 'shopping store shop bag', Icon: ShoppingBag },
  { name: 'ShoppingCart', keywords: 'shopping cart store market', Icon: ShoppingCart },
  { name: 'Gift', keywords: 'gift present reward package', Icon: Gift },
  { name: 'Music', keywords: 'music entertainment sound live', Icon: Music },
  { name: 'Mic', keywords: 'microphone karaoke music stage', Icon: Mic },
  { name: 'Radio', keywords: 'radio music sound entertainment', Icon: Radio },
  { name: 'Tv', keywords: 'tv television screen entertainment', Icon: Tv },
  { name: 'Film', keywords: 'film movie cinema entertainment', Icon: Film },
  { name: 'Clapperboard', keywords: 'movie cinema film theatre', Icon: Clapperboard },
  { name: 'Gamepad2', keywords: 'game arcade play entertainment', Icon: Gamepad2 },
  { name: 'Dices', keywords: 'games casino dice play', Icon: Dices },
  { name: 'Trophy', keywords: 'trophy tournament award winner', Icon: Trophy },
  { name: 'Medal', keywords: 'medal award prize winner', Icon: Medal },
  { name: 'Target', keywords: 'target archery aim sport', Icon: Target },
  { name: 'Volleyball', keywords: 'volleyball beach sport ball', Icon: Volleyball },
  { name: 'Tent', keywords: 'tent camping outdoor glamping', Icon: Tent },
  { name: 'TreePine', keywords: 'tree nature forest park', Icon: TreePine },
  { name: 'TreePalm', keywords: 'palm beach tropical resort', Icon: TreePalm },
  { name: 'Flower', keywords: 'flower garden spa bloom', Icon: Flower },
  { name: 'Flower2', keywords: 'flower garden nature spa', Icon: Flower2 },
  { name: 'Leaf', keywords: 'leaf nature eco green', Icon: Leaf },
  { name: 'Sun', keywords: 'sun day weather sunny outdoor', Icon: Sun },
  { name: 'Moon', keywords: 'moon night evening late', Icon: Moon },
  { name: 'Cloud', keywords: 'cloud weather sky', Icon: Cloud },
  { name: 'Umbrella', keywords: 'umbrella beach rain pool', Icon: Umbrella },
  { name: 'Snowflake', keywords: 'snow ski winter cold ice', Icon: Snowflake },
  { name: 'Wind', keywords: 'wind air weather breeze', Icon: Wind },
  { name: 'Mountain', keywords: 'mountain hiking outdoor nature', Icon: Mountain },
  { name: 'MountainSnow', keywords: 'ski mountain snow winter', Icon: MountainSnow },
  { name: 'Footprints', keywords: 'walk tour hiking trail', Icon: Footprints },
  { name: 'PersonStanding', keywords: 'yoga stretch person fitness', Icon: PersonStanding },
  { name: 'Baby', keywords: 'baby kids childcare family', Icon: Baby },
  { name: 'Dog', keywords: 'dog pet animal walking', Icon: Dog },
  { name: 'Cat', keywords: 'cat pet animal care', Icon: Cat },
  { name: 'PawPrint', keywords: 'pet animal paw friendly', Icon: PawPrint },
  { name: 'Bird', keywords: 'bird nature wildlife', Icon: Bird },
  { name: 'Heart', keywords: 'heart love favorite wellness', Icon: Heart },
  { name: 'HeartPulse', keywords: 'health medical clinic pulse', Icon: HeartPulse },
  { name: 'Stethoscope', keywords: 'doctor clinic medical health', Icon: Stethoscope },
  { name: 'Pill', keywords: 'pharmacy medicine pill health', Icon: Pill },
  { name: 'Syringe', keywords: 'medical clinic injection health', Icon: Syringe },
  { name: 'Cross', keywords: 'medical clinic first aid pharmacy', Icon: Cross },
  { name: 'Shield', keywords: 'security safety shield guard', Icon: Shield },
  { name: 'ShieldCheck', keywords: 'security safe verified protection', Icon: ShieldCheck },
  { name: 'Wifi', keywords: 'wifi internet network connection', Icon: Wifi },
  { name: 'Bluetooth', keywords: 'bluetooth wireless connection', Icon: Bluetooth },
  { name: 'BatteryCharging', keywords: 'charging battery power ev', Icon: BatteryCharging },
  { name: 'PlugZap', keywords: 'charging power ev electric outlet', Icon: PlugZap },
  { name: 'Zap', keywords: 'power electric energy fast', Icon: Zap },
  { name: 'Lightbulb', keywords: 'idea light lamp bulb', Icon: Lightbulb },
  { name: 'Wrench', keywords: 'repair maintenance tool service', Icon: Wrench },
  { name: 'Hammer', keywords: 'repair maintenance build tool', Icon: Hammer },
  { name: 'Scissors', keywords: 'salon barber haircut scissors', Icon: Scissors },
  { name: 'Shirt', keywords: 'laundry clothes shirt dry cleaning', Icon: Shirt },
  { name: 'WashingMachine', keywords: 'laundry wash machine clothes', Icon: WashingMachine },
  { name: 'Sofa', keywords: 'lounge sofa lobby furniture', Icon: Sofa },
  { name: 'Armchair', keywords: 'lounge chair relax furniture', Icon: Armchair },
  { name: 'Lamp', keywords: 'lamp light room furniture', Icon: Lamp },
  { name: 'Toilet', keywords: 'toilet restroom bathroom wc', Icon: Toilet },
  { name: 'CookingPot', keywords: 'cooking kitchen food pot', Icon: CookingPot },
  { name: 'Refrigerator', keywords: 'fridge kitchen minibar cold', Icon: Refrigerator },
  { name: 'Microwave', keywords: 'microwave kitchen heat food', Icon: Microwave },
  { name: 'Camera', keywords: 'camera photo photography', Icon: Camera },
  { name: 'Image', keywords: 'image photo gallery picture', Icon: Image },
  { name: 'Book', keywords: 'book library reading', Icon: Book },
  { name: 'BookOpen', keywords: 'book library reading menu', Icon: BookOpen },
  { name: 'Bookmark', keywords: 'bookmark save tag', Icon: Bookmark },
  { name: 'Newspaper', keywords: 'news newspaper press media', Icon: Newspaper },
  { name: 'Palette', keywords: 'art paint palette craft', Icon: Palette },
  { name: 'Brush', keywords: 'paint brush art craft', Icon: Brush },
  { name: 'Star', keywords: 'star favorite rating premium', Icon: Star },
  { name: 'Crown', keywords: 'crown vip luxury premium royal', Icon: Crown },
  { name: 'Gem', keywords: 'gem luxury premium diamond jewelry', Icon: Gem },
  { name: 'Flag', keywords: 'flag golf marker point', Icon: Flag },
  { name: 'Bell', keywords: 'bell concierge service reception', Icon: Bell },
  { name: 'BellRing', keywords: 'bell alert notification service', Icon: BellRing },
  { name: 'Phone', keywords: 'phone call contact reception', Icon: Phone },
  { name: 'Mail', keywords: 'mail email message post', Icon: Mail },
  { name: 'MessageCircle', keywords: 'chat message support talk', Icon: MessageCircle },
  { name: 'Globe', keywords: 'globe world international tour', Icon: Globe },
  { name: 'Compass', keywords: 'compass tour explore direction', Icon: Compass },
  { name: 'Map', keywords: 'map tour guide location', Icon: MapIcon },
  { name: 'Navigation', keywords: 'navigation direction gps guide', Icon: Navigation },
  { name: 'Rocket', keywords: 'rocket fast launch premium', Icon: Rocket },
  { name: 'Settings', keywords: 'settings gear config service', Icon: Settings },
  { name: 'Home', keywords: 'home house room stay', Icon: Home },
  { name: 'Building', keywords: 'building hotel office property', Icon: Building },
  { name: 'Building2', keywords: 'building hotel property tower', Icon: Building2 },
  { name: 'Hotel', keywords: 'hotel stay accommodation lodging', Icon: Hotel },
  { name: 'Store', keywords: 'store shop market retail', Icon: Store },
  { name: 'Warehouse', keywords: 'warehouse storage hall venue', Icon: Warehouse },
  { name: 'Landmark', keywords: 'landmark bank tour monument', Icon: Landmark },
  { name: 'School', keywords: 'school class course lesson', Icon: School },
  { name: 'Fuel', keywords: 'fuel gas petrol station car', Icon: Fuel },
  { name: 'Accessibility', keywords: 'accessible wheelchair disabled access', Icon: Accessibility },
  { name: 'Cigarette', keywords: 'smoking area lounge cigarette', Icon: Cigarette },
]

const registryByName = new Map(iconRegistry.map(e => [e.name, e]))

// Default when nothing matches
const FallbackIcon = CalendarDays

/**
 * Resolve a stored icon name (lucide key) to its component. Falls back to a
 * keyword match on the service name so legacy services (which stored a keyword
 * like "pool") keep rendering a sensible icon.
 */
export function resolveIcon(iconName?: string, serviceName?: string): LucideIcon {
  if (iconName && registryByName.has(iconName)) {
    return registryByName.get(iconName)!.Icon
  }
  const haystack = `${iconName ?? ''} ${serviceName ?? ''}`.toLowerCase()
  if (haystack.trim()) {
    for (const entry of iconRegistry) {
      if (entry.keywords.split(' ').some(k => k && haystack.includes(k))) {
        return entry.Icon
      }
    }
  }
  return FallbackIcon
}

export function ServiceIcon({
  name,
  serviceName,
  size = 20,
  strokeWidth = 1.75,
  className,
}: {
  name?: string
  serviceName?: string
  size?: number
  strokeWidth?: number
  className?: string
}): React.ReactElement {
  const Icon = resolveIcon(name, serviceName)
  return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />
}

/** Backward-compatible helper: render an icon from a service name. */
export function getServiceIcon(serviceName: string): React.ReactElement {
  return <ServiceIcon serviceName={serviceName} />
}
