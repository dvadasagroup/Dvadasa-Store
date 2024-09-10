"use client";

import useCart from "@/lib/hooks/useCart";
import { useUser } from "@clerk/nextjs";
import { MinusCircle, PlusCircle, Trash } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const Cart = () => {
  const router = useRouter();
  const { user } = useUser();
  const cart = useCart();
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
  }, []);

  const total = cart.cartItems.reduce(
    (acc, cartItem) => acc + cartItem.item.price * cartItem.quantity,
    0
  );
  const totalRounded = parseFloat(total.toFixed(2));

  const customer = {
    clerkId: user?.id,
    email: user?.emailAddresses[0]?.emailAddress,
    name: user?.firstName,
    shippingRate: totalRounded,
  };

  const handleCheckout = async () => {
    try {
      if (!user) {
        router.push("sign-in");
        return;
      }

      if (!razorpayLoaded) {
        throw new Error("Razorpay SDK not loaded");
      }


      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/create-razorpay-order`;

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cartItems: cart.cartItems, customer }),
      });


      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();

      if (!data.order?.id) {
        throw new Error("Failed to create Razorpay order");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: data.order.amount,
        currency: data.order.currency,
        order_id: data.order.id,
        name: "Gantala Avinash",
        description: "Payment for products",
        handler: function (response: any) {
          router.push("/payment_success");
        },
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: "+919515953713",
        },
        notes: {
          clerkId: customer.clerkId,
          shippingRate: customer.shippingRate,
        },
        theme: {
          color: "#F37254",
        },
      };


      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (err) {
      if (err instanceof TypeError) {
        alert("Network error. Please check your internet connection and try again.");
      } else if (err instanceof Error) {
        console.error("[handleCheckout] Error:", err);
        alert(err.message || "Failed to initiate payment. Please try again later.");
      } else {
        console.error("[handleCheckout] Unknown error:", err);
        alert("An unknown error occurred. Please try again later.");
      }
    }
  };

  return (
    <div className="flex gap-20 py-16 px-10 max-lg:flex-col">
      <div className="w-2/3 max-lg:w-full">
        <p className="text-heading3-bold">Shopping Cart</p>
        <hr className="my-6" />

        {cart.cartItems.length === 0 ? (
          <p className="text-body-bold">No item in cart</p>
        ) : (
          <div>
            {cart.cartItems.map((cartItem) => (
              <div
                className="w-full flex max-sm:flex-col max-sm:gap-3 hover:bg-grey-1 px-6 py-5 items-center max-sm:items-start justify-between dark:hover:bg-zinc-800"
                key={cartItem.item._id}
              >
                <div className="flex items-center">
                  <Image
                    src={cartItem.item.media[0]}
                    width={100}
                    height={100}
                    className="rounded-lg w-32 h-32 object-cover"
                    alt="product"
                  />
                  <div className="flex flex-col gap-3 ml-4">
                    <p className="text-body-bold">{cartItem.item.title}</p>
                    {cartItem.color && (
                      <p className="text-small-medium">{cartItem.color}</p>
                    )}
                    {cartItem.size && (
                      <p className="text-small-medium">{cartItem.size}</p>
                    )}
                    <p className="text-small-medium">₹{cartItem.item.price}</p>
                  </div>
                </div>

                <div className="flex gap-4 items-center">
                  <MinusCircle
                    className="hover:text-red-1 cursor-pointer"
                    onClick={() => cart.decreaseQuantity(cartItem.item._id)}
                  />
                  <p className="text-body-bold">{cartItem.quantity}</p>
                  <PlusCircle
                    className="hover:text-red-1 cursor-pointer"
                    onClick={() => cart.increaseQuantity(cartItem.item._id)}
                  />
                </div>

                <Trash
                  className="hover:text-red-1 cursor-pointer"
                  onClick={() => cart.removeItem(cartItem.item._id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-1/3 max-lg:w-full flex flex-col gap-8 bg-grey-1 rounded-lg px-4 py-6 dark:bg-zinc-800 dark:text-white">
        <p className="text-heading4-bold pb-4">
          Summary{" "}
          <span>{`(${cart.cartItems.length} ${
            cart.cartItems.length > 1 ? "items" : "item"
          })`}</span>
        </p>
        <div className="flex justify-between text-body-semibold">
          <span>Total Amount: </span>
          <span>₹{totalRounded}</span>
        </div>

        <button
          className="mt-10 flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          onClick={handleCheckout}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export const dynamic = "force-dynamic";

export default Cart;
