
## Non-conventional error passing
Our various modules does not use the standard convention in node of having an error as the first callback argument. This
makes it harder to reason about how errors are passed around.
