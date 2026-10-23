import { MaterialIcons } from '@expo/vector-icons';

export interface Destaque {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}

export interface Produto {
  id: string;
  categoria: string;
  titulo: string;
  preco: string;
  descricaoCurta: string;
  sinopse: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  imagemUri: string;
  destaques: Destaque[];
  conteudo: string[];
}

export const PRODUTOS: Produto[] = [
  {
    id: 'manual-jogador',
    categoria: 'Core Rulebook • D&D 5e',
    titulo: 'Manual do Jogador',
    preco: 'R$ 149,90',
    descricaoCurta: 'Raças, Classes, Magias e Regras',
    sinopse: 'Tudo que um jogador precisa pra criar heróis memoráveis: raças, classes, antecedentes, equipamentos e centenas de feitiços, no maior jogo de RPG do mundo.',
    icon: 'menu-book',
    imagemUri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyGRGsbS6oONbAm6MN62__orabCN4R8SYkgK1MW5wbV1quEorWtHc3h-YSVElHqwAk4b2Z-2Kx4l7GIT3tqUmgVKC5QxdEJRSpDTKJM_tMYV8vbJseX8k2bkhlNGkxmEfzzqzpD2yUfH76S3rN1ik2cJ5OESwGyhqqpqasHqEb1-weLctilx-r-YG9zQbnO3vb412dfKsQGgbQvU60S0YygEDw1cUaHXGDmhukeP3tt3YKqRIr3DjRbg',
    destaques: [
      { icon: 'groups', label: '9 Raças' },
      { icon: 'category', label: '12 Classes' },
      { icon: 'auto-awesome', label: '300+ Feitiços' },
      { icon: 'backpack', label: 'Equipamentos' },
    ],
    conteudo: ['Capítulo 1: Criando um Personagem', 'Capítulo 2: Raças', 'Capítulo 3: Classes'],
  },
  {
    id: 'guia-mestre',
    categoria: 'Core Rulebook • D&D 5e',
    titulo: 'Guia do Mestre',
    preco: 'R$ 149,90',
    descricaoCurta: 'Criação de Mundos e Tesouros',
    sinopse: 'Ferramentas essenciais pra quem narra: criação de mundos, tesouros mágicos, NPCs memoráveis e conselhos pra conduzir qualquer mesa com confiança.',
    icon: 'security',
    imagemUri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWZFiC5LkXFDApFv_2__1AVHR3HAEQ62xdK3_qvfml591AbsliGPvX88KX3B2ycJwkxfppUmj42GD76Gi2fS8XiAOYsWSJZXR5jZhcSAcEtb0vmi8a9jOMQcyoxjaAe6r9blJFQ_FrSn2ig4hPc0CxIS-VK3QyS6EcCRdUK6IY9pEgEMe4AH-3Aa5_j0mrhkdCPTmEWNmnncVJgV77Uy8QPJEst4m9ocmKV0xUdBXvbRMc7MDsElsLRw',
    destaques: [
      { icon: 'diamond', label: '400+ Itens Mágicos' },
      { icon: 'map', label: 'Criação de Mundos' },
      { icon: 'groups', label: 'NPCs e Facções' },
      { icon: 'auto-stories', label: 'Aventuras Prontas' },
    ],
    conteudo: ['Capítulo 1: Mestrando o Jogo', 'Capítulo 2: Criando Aventuras', 'Capítulo 3: Tesouros'],
  },
  {
    id: 'manual-monstros',
    categoria: 'Bestiário • D&D 5e',
    titulo: 'Manual dos Monstros',
    preco: 'R$ 149,90',
    descricaoCurta: 'Criaturas, Chefes e Estatísticas',
    sinopse: 'Centenas de criaturas prontas pra usar, de goblins a dragões ancestrais, cada uma com estatísticas completas e conselhos de uso em combate.',
    icon: 'pets',
    imagemUri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUtMA0kgveeuCsBPdWpwaLLvFWtTIaZZPdw4FsVvO1kvqjKveWyYELsFzQb4GminmKdyyP7B3gZXIHG8hEKMzeR49r0kQlY6ZxLyKdr__xsI7QMt3iz2JOAXiTO0M899W6I6yU-BXA7-7ObVeOnVK8qs8FULxHJc4VCQMIIR_x-cOOBZ_9xaIAvVehwY85guebZdAwC7bHwnNK2_j9KUuoQEVL3zTaJrfhqxmO8e2mX9FIFitZ2w5PsQ',
    destaques: [
      { icon: 'pest-control', label: '300+ Monstros' },
      { icon: 'whatshot', label: 'Chefes Épicos' },
      { icon: 'casino', label: 'Estatísticas Completas' },
      { icon: 'auto-awesome', label: 'Habilidades Únicas' },
    ],
    conteudo: ['Capítulo 1: Como Usar Monstros', 'Capítulo 2: Bestiário A-M', 'Capítulo 3: Bestiário N-Z'],
  },
];

export function getProdutoById(id?: string): Produto | undefined {
  return PRODUTOS.find((p) => p.id === id);
}