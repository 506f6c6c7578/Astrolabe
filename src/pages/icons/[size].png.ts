import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from "astro";
import { createLogoSvg, iconSizes } from "@/lib/brand";
import { renderPng } from "@/lib/png";

export const getStaticPaths = (() => iconSizes.map((size) => ({
    params: { size: String(size) },
    props: { size }
}))) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = ({ props }) => renderPng(createLogoSvg({
    size: props.size,
    radius: 0
}));
