import React from 'react';
import { 
  Utensils, Car, Home, Film, Zap, Heart, Circle, ShoppingBag, 
  Coffee, Plane, Wifi, Gift, Book, Smartphone, Briefcase, 
  GraduationCap, Music, Dumbbell, ShoppingCart
} from 'lucide-react';

export const ICON_OPTIONS = [
  { name: 'Utensils', component: Utensils },
  { name: 'Car', component: Car },
  { name: 'Home', component: Home },
  { name: 'ShoppingBag', component: ShoppingBag },
  { name: 'ShoppingCart', component: ShoppingCart },
  { name: 'Film', component: Film },
  { name: 'Zap', component: Zap },
  { name: 'Heart', component: Heart },
  { name: 'Coffee', component: Coffee },
  { name: 'Plane', component: Plane },
  { name: 'Wifi', component: Wifi },
  { name: 'Gift', component: Gift },
  { name: 'Book', component: Book },
  { name: 'Smartphone', component: Smartphone },
  { name: 'Briefcase', component: Briefcase },
  { name: 'GraduationCap', component: GraduationCap },
  { name: 'Music', component: Music },
  { name: 'Dumbbell', component: Dumbbell },
  { name: 'Circle', component: Circle },
];

interface CategoryIconProps {
  iconName: string;
  className?: string;
  color?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ iconName, className, color }) => {
  const iconEntry = ICON_OPTIONS.find(i => i.name === iconName);
  const IconComponent = iconEntry ? iconEntry.component : Circle;
  
  return <IconComponent className={className} style={color ? { color } : undefined} />;
};