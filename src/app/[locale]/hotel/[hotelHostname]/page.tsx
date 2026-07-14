import React from 'react';

export default async function HotelPage({
  params,
}: {
  params: Promise<{ locale: string; hotelHostname: string }>;
}) {
  const { locale, hotelHostname } = await params;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-sm text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 capitalize">
          Welcome to {hotelHostname}
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          This is the public-facing booking page for the {hotelHostname} hotel.
        </p>
        <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm text-left">
          <strong>Developer Notes:</strong>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Subdomain detected: <code>{hotelHostname}</code></li>
            <li>Locale requested: <code>{locale}</code></li>
            <li>Next step: Fetch the hotel document from MongoDB where <code>subdomain = "{hotelHostname}"</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
