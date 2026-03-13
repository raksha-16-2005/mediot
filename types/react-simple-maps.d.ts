declare module 'react-simple-maps' {
  import React from 'react';

  interface GeographyObject {
    properties: Record<string, unknown>;
    rsmKey: string;
    geometry?: unknown;
    [key: string]: unknown;
  }

  export const MapProvider: React.FC<{ children: React.ReactNode }>;
  export const ComposableMap: React.FC<{
    projection?: string;
    children?: React.ReactNode;
    [key: string]: unknown;
  }>;
  export const Geographies: React.FC<{
    geography: string;
    children: (props: { geographies: GeographyObject[] }) => React.ReactNode;
  }>;
  export const Geography: React.FC<{
    geography: GeographyObject;
    onClick?: (geography: GeographyObject) => void;
    style?: {
      default?: Record<string, unknown>;
      hover?: Record<string, unknown>;
      pressed?: Record<string, unknown>;
    };
    className?: string;
    [key: string]: unknown;
  }>;
  export const Marker: React.FC<{
    coordinates: [number, number];
    children?: React.ReactNode;
  }>;
  export const Line: React.FC<{
    from: [number, number];
    to: [number, number];
    stroke?: string;
    strokeWidth?: number;
    [key: string]: unknown;
  }>;
}
