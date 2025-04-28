'use client';

import Navbar from "./components/Navbar";
import Link from "next/link";
import { useWeb3 } from "./context/Web3Context";

export default function Home() {
  const { isConnected } = useWeb3();

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      <Navbar />

      <div className="relative isolate">
        {/* Hero section */}
        <div className="py-24 sm:py-32 lg:pb-40">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-green-900 sm:text-6xl">
                Sustainable Dining with GreenDish
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                A revolutionary platform connecting eco-conscious diners with sustainable restaurants.
                Earn rewards while reducing your carbon footprint.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                {!isConnected ? (
                  <Link
                    href="/marketplace"
                    className="rounded-md bg-green-600 px-5 py-3 text-md font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                  >
                    Browse Marketplace
                  </Link>
                ) : (
                  <Link
                    href="/profile"
                    className="rounded-md bg-green-600 px-5 py-3 text-md font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                  >
                    View Your Profile
                  </Link>
                )}
                <Link
                  href="/restaurant/register"
                  className="text-md font-semibold leading-6 text-gray-900"
                >
                  Restaurant Sign-up <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            <div className="mt-16 flow-root sm:mt-24">
              <div className="rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:rounded-2xl">
                <div className="rounded-xl bg-white p-8 shadow-xl ring-1 ring-gray-900/10">
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="border-l-4 border-green-500 pl-4">
                      <h3 className="text-lg font-semibold text-gray-900">For Diners</h3>
                      <p className="mt-2 text-sm text-gray-600">
                        Discover sustainable dining options, earn tokens for green choices,
                        and contribute to reducing the carbon footprint of the food industry.
                      </p>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                      <h3 className="text-lg font-semibold text-gray-900">For Restaurants</h3>
                      <p className="mt-2 text-sm text-gray-600">
                        Showcase your sustainable practices, attract eco-conscious customers,
                        and participate in a carbon credit marketplace.
                      </p>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                      <h3 className="text-lg font-semibold text-gray-900">How It Works</h3>
                      <p className="mt-2 text-sm text-gray-600">
                        Connect your wallet, browse sustainable restaurants,
                        earn GreenCoins for purchases, and rate your dining experiences.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How it works section */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-green-600">
                Sustainable Dining
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                How GreenDish Works
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Our platform connects restaurants with sustainability practices to diners
                who want to make environmentally conscious dining choices.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                    Browse Sustainable Dishes
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Restaurants list dishes with carbon footprint data. Browse options to find
                      eco-friendly choices based on local sourcing and carbon impact.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    Earn GreenCoin Rewards
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Get rewarded with GreenCoins for choosing sustainable options. The more
                      eco-friendly your choices, the more tokens you earn.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                    </div>
                    Rate & Review
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Share your experiences and earn additional rewards for providing valuable
                      feedback that helps others make informed dining choices.
                    </p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-green-900 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">GreenDish</h3>
              <p className="text-green-200">
                Making sustainable dining choices easier and more rewarding.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/marketplace" className="text-green-200 hover:text-white">
                    Marketplace
                  </Link>
                </li>
                <li>
                  <Link href="/restaurant/register" className="text-green-200 hover:text-white">
                    Restaurant Sign-up
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="text-green-200 hover:text-white">
                    My Profile
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect</h3>
              <p className="text-green-200 mb-4">
                Join our growing community of eco-conscious diners and sustainable restaurants.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-green-200 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-green-200 hover:text-white">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-green-800 pt-8 text-center">
            <p className="text-green-200 text-sm">
              &copy; {new Date().getFullYear()} GreenDish. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
